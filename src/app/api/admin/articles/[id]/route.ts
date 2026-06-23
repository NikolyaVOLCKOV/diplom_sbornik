import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomUUID } from 'node:crypto';
import { writeFile, mkdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import pool from '@/lib/db';

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
    issue_id: string;
    section_id: string;
    pages_from?: number;
    pages_to?: number;
    status: 'draft' | 'review' | 'published' | 'retracted';
    authors: AuthorInput[];
    keywords: string[];
};

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    // 1. Авторизация (упрощённая)
    const token = (await cookies()).get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

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

    // 4. Новый PDF (если есть)
    let newPdfPath: string | null = null;
    let newAbsPdfPath: string | null = null;
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
        newAbsPdfPath = path.join(absDir, filename);
        await writeFile(newAbsPdfPath, Buffer.from(await pdf.arrayBuffer()));
        newPdfPath = `${uploadDir}/articles/${filename}`;
    }

    // 5. Транзакция
    const client = await pool.connect();
    let oldPdfPath: string | null = null;
    try {
        await client.query('BEGIN');

        // 5.1. Проверка существования + получение старого pdf_path
        const existing = await client.query<{ pdf_path: string | null }>(
            `SELECT pdf_path FROM articles WHERE id = $1`,
            [id]
        );
        if (!existing.rowCount) {
            await client.query('ROLLBACK');
            return NextResponse.json({ error: 'Статья не найдена' }, { status: 404 });
        }
        oldPdfPath = existing.rows[0].pdf_path;

        // 5.2. UPDATE articles
        try {
            await client.query(
                `UPDATE articles SET
           title_ru = $1, title_en = $2,
           abstract_ru = $3, abstract_en = $4,
           doi = $5, status = $6,
           issue_id = $7, section_id = $8,
           pages_from = $9, pages_to = $10,
           pdf_path = COALESCE($11, pdf_path),
           published_at = CASE
             WHEN $6 = 'published' AND published_at IS NULL THEN CURRENT_DATE
             ELSE published_at
           END
         WHERE id = $12`,
                [
                    data.title_ru.trim(),
                    data.title_en?.trim() || null,
                    data.abstract_ru.trim(),
                    data.abstract_en?.trim() || null,
                    data.doi?.trim() || null,
                    data.status,
                    data.issue_id,
                    data.section_id,
                    data.pages_from ?? null,
                    data.pages_to ?? null,
                    newPdfPath,
                    id,
                ]
            );
        } catch (e: unknown) {
            if (e && typeof e === 'object' && 'code' in e && e.code === '23505') {
                throw new Error('Статья с таким DOI уже существует');
            }
            throw e;
        }

        // 5.3. Авторы — полная пересборка
        await client.query(`DELETE FROM article_authors WHERE article_id = $1`, [id]);

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

            let affiliationId: string | null = null;
            if (a.affiliation?.trim()) {
                const affName = a.affiliation.trim();
                const existingAff = await client.query(
                    `SELECT id FROM affiliations WHERE name_ru = $1 LIMIT 1`,
                    [affName]
                );
                if (existingAff.rowCount) {
                    affiliationId = existingAff.rows[0].id;
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
                [id, authorId, affiliationId, i + 1, i === 0]
            );
        }

        // 5.4. Ключевые слова — пересборка
        await client.query(`DELETE FROM article_keywords WHERE article_id = $1`, [id]);
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
                [id, kwRes.rows[0].id]
            );
        }

        await client.query('COMMIT');

        // 5.5. Если был залит новый PDF — попробуем удалить старый
        if (newPdfPath && oldPdfPath) {
            try {
                await unlink(path.join(process.cwd(), oldPdfPath));
            } catch {
                // не критично — старый файл просто останется на диске
            }
        }

        return NextResponse.json({ ok: true, id });
    } catch (e) {
        await client.query('ROLLBACK');
        if (newAbsPdfPath) {
            try { await unlink(newAbsPdfPath); } catch { /* ignore */ }
        }
        console.error(e);
        const msg = e instanceof Error ? e.message : 'Ошибка БД';
        return NextResponse.json({ error: msg }, { status: 500 });
    } finally {
        client.release();
    }
}