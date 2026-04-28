import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const token = req.cookies.get('auth_token')
    if (!token) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

    const { id } = await params
    const client = await pool.connect()

    try {
        await client.query('BEGIN')
        await client.query(`UPDATE issues SET is_current = FALSE WHERE is_current = TRUE`)
        await client.query(`UPDATE issues SET is_current = TRUE WHERE id = $1`, [id])
        await client.query('COMMIT')

        return NextResponse.redirect(new URL('/admin/issues', req.url))
    } catch (err) {
        await client.query('ROLLBACK')
        console.error('Set current issue error:', err)
        return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
    } finally {
        client.release()
    }
}