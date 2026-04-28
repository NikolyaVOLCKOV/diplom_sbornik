import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const token = req.cookies.get('auth_token')
    if (!token) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

    const { id } = await params
    const client = await pool.connect()

    try {
        const { volume, number, year, title_ru, is_current } = await req.json()

        if (!volume || !number || !year) {
            return NextResponse.json({ error: 'Заполните обязательные поля' }, { status: 400 })
        }

        await client.query('BEGIN')

        if (is_current) {
            await client.query(
                `UPDATE issues SET is_current = FALSE WHERE is_current = TRUE AND id != $1`,
                [id]
            )
        }

        await client.query(
            `UPDATE issues
       SET volume=$1, number=$2, year=$3, title_ru=$4, is_current=$5
       WHERE id=$6`,
            [volume, number, year, title_ru || null, is_current || false, id]
        )

        await client.query('COMMIT')

        return NextResponse.json({ ok: true })
    } catch (err) {
        await client.query('ROLLBACK')
        console.error('Update issue error:', err)
        return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
    } finally {
        client.release()
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const token = req.cookies.get('auth_token')
    if (!token) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

    const { id } = await params
    const client = await pool.connect()

    try {
        // Проверяем что в выпуске нет статей
        const articles = await client.query(
            `SELECT COUNT(*) AS count FROM articles WHERE issue_id = $1`,
            [id]
        )

        if (Number(articles.rows[0].count) > 0) {
            return NextResponse.json(
                { error: 'Нельзя удалить выпуск со статьями. Сначала удалите или перенесите статьи.' },
                { status: 400 }
            )
        }

        await client.query(`DELETE FROM issues WHERE id = $1`, [id])

        return NextResponse.json({ ok: true })
    } catch (err) {
        console.error('Delete issue error:', err)
        return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
    } finally {
        client.release()
    }
}