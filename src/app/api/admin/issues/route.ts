import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function POST(req: NextRequest) {
    const token = req.cookies.get('auth_token')
    if (!token) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

    const client = await pool.connect()

    try {
        const { volume, number, year, title_ru, is_current } = await req.json()

        if (!volume || !number || !year) {
            return NextResponse.json({ error: 'Заполните обязательные поля' }, { status: 400 })
        }

        await client.query('BEGIN')

        if (is_current) {
            await client.query(`UPDATE issues SET is_current = FALSE WHERE is_current = TRUE`)
        }

        const result = await client.query(
            `INSERT INTO issues (volume, number, year, title_ru, is_current)
       VALUES ($1,$2,$3,$4,$5) RETURNING id`,
            [volume, number, year, title_ru || null, is_current || false]
        )

        await client.query('COMMIT')

        return NextResponse.json({ ok: true, id: result.rows[0].id })
    } catch (err) {
        await client.query('ROLLBACK')
        console.error('Create issue error:', err)
        return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
    } finally {
        client.release()
    }
}