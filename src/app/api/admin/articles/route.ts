import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomUUID } from 'node:crypto';
import { writeFile, mkdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import pool from '@/lib/db';

import { verifyToken } from '@/lib/auth'; // подставь свою функцию

export const runtime = 'nodejs';

type AuthorInput = {
    last_name_ru: string;
    first_name_ru: string;
    middle_name_ru?: string;
    orcid?: string;
    affiliation?: string;
};

type Payload = {
    title_ru: string;
    title_en?: string;
    abstract_ru: string;
    abstract_en?: string;
    doi?: string;
    issue_id: string;       // UUID
    section_id: string;     // UUID
    pages_from?: number;
    pages_to?: number;
    status: 'draft' | 'review' | 'published' | 'retracted';
    authors: AuthorInput[];
    keywords: string[];
};

export async function POST(req: NextRequest) {
    // 1. Авторизация
    const token = (await cookies()).get('auth_token')?.value;
    const user = token ? await verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    // 2. Парсинг multipart
    const form = await req.formData();
    const rawPayload = form.get('payload');
    const pdf = form.get('pdf');

    if (typeof rawPayload !== 'string') {
        return NextResponse.json({ error: 'Нет payload' }, { status: 400 });
    }

    let data: Payload;
    try {
        data = JSON.parse(rawPayload);
    } catch {
        return NextResponse.json({ error: 'Невалидный JSON' }, { status: 400 });
    }

    // 3. Валидация
    if (!data.title_ru?.trim() || !data.abstract_ru?.trim() || !data.issue_id || !data.section_id) {
        return NextResponse.json({ error: 'Заполни обязательные поля' }, { status: 400 });
    }
    if (!data.authors?.length) {
        return NextResponse.json({ error: 'Нужен хотя бы один автор' }, { status: 400 });
    }
    if (!['draft', 'review', 'published', 'retracted'].includes(data.status)) {
        return NextResponse.json({ error: 'Невалидный статус' }, { status: 400 });
    }

    // 4. Сохраняем PDF (если есть)
    let pdfPath: string | null = null;
    let absPdfPath: string | null = null;
    if (pdf instanceof File && pdf.size > 0) {
        if (pdf.type !== 'application/pdf') {
            return NextResponse.json({ error: 'Файл должен быть PDF' }, { status: 400 });
        }
        if (pdf.size > 50 * 1024 * 1024) {
            return NextResponse.json({ error: 'PDF больше 50 МБ' }, { status: 400 });
        }
        const uploadDir = process.env.UPLOAD_DIR || 'uploads';
        const filename = `${randomUUID()}.pdf`;
        const absDir = path.join(process.cwd(), uploadDir, 'articles');
        await mkdir(absDir, { recursive: true });
        absPdfPath = path.join(absDir, filename);
        await writeFile(absPdfPath, Buffer.from(await pdf.arrayBuffer()));
        pdfPath = `${uploadDir}/articles/${filename}`;
    }

    // 5. Транзакция
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 5.1. Статья
        let articleId: string;
        try {
            const articleRes = await client.query(
                `INSERT INTO articles
           (title_ru, title_en, abstract_ru, abstract_en,
            doi, pdf_path, status, issue_id, section_id,
            pages_from, pages_to, published_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
                 CASE WHEN $7 = 'published' THEN CURRENT_DATE ELSE NULL END)
         RETURNING id`,
                [
                    data.title_ru.trim(),
                    data.title_en?.trim() || null,
                    data.abstract_ru.trim(),
                    data.abstract_en?.trim() || null,
                    data.doi?.trim() || null,
                    pdfPath,
                    data.status,
                    data.issue_id,
                    data.section_id,
                    data.pages_from ?? null,
                    data.pages_to ?? null,
                ]
            );
            articleId = articleRes.rows[0].id;
        } catch (e: unknown) {
            // Конфликт по UNIQUE doi
            if (e && typeof e === 'object' && 'code' in e && e.code === '23505') {
                throw new Error('Статья с таким DOI уже существует');
            }
            throw e;
        }

        // 5.2. Авторы (поиск по ORCID если есть, иначе создаём)
        for (let i = 0; i < data.authors.length; i++) {
            const a = data.authors[i];
            let authorId: string;

            if (a.orcid?.trim()) {
                const found = await client.query(
                    `SELECT id FROM authors WHERE orcid = $1 LIMIT 1`,
                    [a.orcid.trim()]
                );
                if (found.rowCount) {
                    authorId = found.rows[0].id;
                } else {
                    const ins = await client.query(
                        `INSERT INTO authors (last_name_ru, first_name_ru, middle_name_ru, orcid)
             VALUES ($1, $2, $3, $4) RETURNING id`,
                        [a.last_name_ru.trim(), a.first_name_ru.trim(), a.middle_name_ru?.trim() || null, a.orcid.trim()]
                    );
                    authorId = ins.rows[0].id;
                }
            } else {
                const ins = await client.query(
                    `INSERT INTO authors (last_name_ru, first_name_ru, middle_name_ru)
           VALUES ($1, $2, $3) RETURNING id`,
                    [a.last_name_ru.trim(), a.first_name_ru.trim(), a.middle_name_ru?.trim() || null]
                );
                authorId = ins.rows[0].id;
            }

            // Аффилиация — SELECT + INSERT (UNIQUE нет в схеме)
            let affiliationId: string | null = null;
            if (a.affiliation?.trim()) {
                const affName = a.affiliation.trim();
                const existing = await client.query(
                    `SELECT id FROM affiliations WHERE name_ru = $1 LIMIT 1`,
                    [affName]
                );
                if (existing.rowCount) {
                    affiliationId = existing.rows[0].id;
                } else {
                    const aff = await client.query(
                        `INSERT INTO affiliations (name_ru) VALUES ($1) RETURNING id`,
                        [affName]
                    );
                    affiliationId = aff.rows[0].id;
                }
            }

            await client.query(
                `INSERT INTO article_authors
           (article_id, author_id, affiliation_id, author_order, is_corresponding)
         VALUES ($1, $2, $3, $4, $5)`,
                [articleId, authorId, affiliationId, i + 1, i === 0] // первый автор — corresponding
            );
        }

        // 5.3. Ключевые слова (word_ru уже UNIQUE)
        for (const kw of data.keywords.map(k => k.trim()).filter(Boolean)) {
            const kwRes = await client.query(
                `INSERT INTO keywords (word_ru) VALUES ($1)
         ON CONFLICT (word_ru) DO UPDATE SET word_ru = EXCLUDED.word_ru
         RETURNING id`,
                [kw]
            );
            await client.query(
                `INSERT INTO article_keywords (article_id, keyword_id) VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
                [articleId, kwRes.rows[0].id]
            );
        }

        await client.query('COMMIT');
        return NextResponse.json({ ok: true, id: articleId });
    } catch (e) {
        await client.query('ROLLBACK');
        // Удаляем PDF, если он был сохранён
        if (absPdfPath) {
            try { await unlink(absPdfPath); } catch { /* ignore */ }
        }
        console.error(e);
        const msg = e instanceof Error ? e.message : 'Ошибка БД';
        return NextResponse.json({ error: msg }, { status: 500 });
    } finally {
        client.release();
    }
}