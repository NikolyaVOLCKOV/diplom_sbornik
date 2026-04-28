import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import pool from '@/lib/db'

export async function POST(req: NextRequest) {
    // Проверка куки
    const token = req.cookies.get('auth_token')
    if (!token) {
        return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const client = await pool.connect()

    try {
        const body = await req.json()
        const {
            issue_id, section_id,
            title_ru, title_en,
            abstract_ru, abstract_en,
            doi, pages_from, pages_to,
            keywords_ru, status,
            authors,
        } = body

        if (!title_ru || !issue_id || !section_id) {
            return NextResponse.json({ error: 'Заполните обязательные поля' }, { status: 400 })
        }

        await client.query('BEGIN')

        // 1. Создаём статью
        const articleRes = await client.query(
            `INSERT INTO articles
        (issue_id, section_id, title_ru, title_en, abstract_ru, abstract_en,
         doi, pages_from, pages_to, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id`,
            [
                issue_id, section_id,
                title_ru, title_en || null,
                abstract_ru || null, abstract_en || null,
                doi || null,
                pages_from ? Number(pages_from) : null,
                pages_to   ? Number(pages_to)   : null,
                status || 'draft',
            ]
        )
        const articleId = articleRes.rows[0].id

        // 2. Сохраняем авторов
        if (Array.isArray(authors)) {
            for (let i = 0; i < authors.length; i++) {
                const a = authors[i]
                if (!a.last_name_ru || !a.first_name_ru) continue

                // Ищем существующего автора или создаём нового
                const existing = await client.query(
                    `SELECT id FROM authors
           WHERE last_name_ru = $1 AND first_name_ru = $2
             AND COALESCE(middle_name_ru,'') = COALESCE($3,'')
           LIMIT 1`,
                    [a.last_name_ru, a.first_name_ru, a.middle_name_ru || null]
                )

                let authorId: string
                if (existing.rows.length > 0) {
                    authorId = existing.rows[0].id
                } else {
                    const newAuthor = await client.query(
                        `INSERT INTO authors (last_name_ru, first_name_ru, middle_name_ru, orcid)
             VALUES ($1,$2,$3,$4) RETURNING id`,
                        [a.last_name_ru, a.first_name_ru, a.middle_name_ru || null, a.orcid || null]
                    )
                    authorId = newAuthor.rows[0].id
                }

                // Связываем автора со статьёй
                await client.query(
                    `INSERT INTO article_authors (article_id, author_id, author_order)
           VALUES ($1,$2,$3)`,
                    [articleId, authorId, i + 1]
                )
            }
        }

        // 3. Сохраняем ключевые слова
        if (keywords_ru) {
            const keywords = keywords_ru
                .split(',')
                .map((k: string) => k.trim())
                .filter(Boolean)

            for (const kw of keywords) {
                const existing = await client.query(
                    `SELECT id FROM keywords WHERE keyword_ru = $1 LIMIT 1`,
                    [kw]
                )

                let kwId: string
                if (existing.rows.length > 0) {
                    kwId = existing.rows[0].id
                } else {
                    const newKw = await client.query(
                        `INSERT INTO keywords (keyword_ru) VALUES ($1) RETURNING id`,
                        [kw]
                    )
                    kwId = newKw.rows[0].id
                }

                await client.query(
                    `INSERT INTO article_keywords (article_id, keyword_id) VALUES ($1,$2)`,
                    [articleId, kwId]
                )
            }
        }

        await client.query('COMMIT')

        return NextResponse.json({ ok: true, id: articleId })

    } catch (err) {
        await client.query('ROLLBACK')
        console.error('Create article error:', err)
        return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
    } finally {
        client.release()
    }
}