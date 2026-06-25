import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import  pool  from '@/lib/db';

export const runtime = 'nodejs';

type Payload = {
    volume: number;
    number: number;
    year: number;
    title_ru?: string;
    title_en?: string;
    published_at?: string;
    cover_url?: string;
    is_current?: boolean;
};

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    const token = (await cookies()).get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    let data: Payload;
    try {
        data = await req.json();
    } catch {
        return NextResponse.json({ error: 'Невалидный JSON' }, { status: 400 });
    }

    if (!Number.isInteger(data.volume) || data.volume < 1
        || !Number.isInteger(data.number) || data.number < 1
        || !Number.isInteger(data.year) || data.year < 1900 || data.year > 2100) {
        return NextResponse.json({ error: 'Невалидные числовые поля' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const exists = await client.query(`SELECT 1 FROM issues WHERE id = $1`, [id]);
        if (!exists.rowCount) {
            await client.query('ROLLBACK');
            return NextResponse.json({ error: 'Выпуск не найден' }, { status: 404 });
        }

        if (data.is_current) {
            await client.query(
                `UPDATE issues SET is_current = FALSE WHERE is_current = TRUE AND id != $1`,
                [id]
            );
        }

        await client.query(
            `UPDATE issues SET
         volume = $1, number = $2, year = $3,
         title_ru = $4, title_en = $5,
         published_at = $6, cover_url = $7,
         is_current = $8
       WHERE id = $9`,
            [
                data.volume,
                data.number,
                data.year,
                data.title_ru?.trim() || null,
                data.title_en?.trim() || null,
                data.published_at || null,
                data.cover_url?.trim() || null,
                !!data.is_current,
                id,
            ]
        );

        await client.query('COMMIT');
        return NextResponse.json({ ok: true });
    } catch (e: unknown) {
        await client.query('ROLLBACK');
        if (e && typeof e === 'object' && 'code' in e && e.code === '23505') {
            return NextResponse.json(
                { error: `Выпуск Т.${data.volume} №${data.number} уже существует` },
                { status: 409 }
            );
        }
        console.error(e);
        return NextResponse.json({ error: 'Ошибка БД' }, { status: 500 });
    } finally {
        client.release();
    }
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    const token = (await cookies()).get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    try {
        await pool.query(`DELETE FROM issues WHERE id = $1`, [id]);
        return NextResponse.json({ ok: true });
    } catch (e: unknown) {
        // ON DELETE RESTRICT в схеме — нельзя удалить выпуск со статьями
        if (e && typeof e === 'object' && 'code' in e && e.code === '23503') {
            return NextResponse.json(
                { error: 'Нельзя удалить выпуск, в котором есть статьи' },
                { status: 409 }
            );
        }
        console.error(e);
        return NextResponse.json({ error: 'Ошибка БД' }, { status: 500 });
    }
}