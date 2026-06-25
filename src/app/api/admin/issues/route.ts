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
    published_at?: string; // YYYY-MM-DD
    cover_url?: string;
    is_current?: boolean;
};

export async function POST(req: NextRequest) {
    const token = (await cookies()).get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    let data: Payload;
    try {
        data = await req.json();
    } catch {
        return NextResponse.json({ error: 'Невалидный JSON' }, { status: 400 });
    }

    // Валидация
    if (!Number.isInteger(data.volume) || data.volume < 1) {
        return NextResponse.json({ error: 'Том должен быть целым положительным' }, { status: 400 });
    }
    if (!Number.isInteger(data.number) || data.number < 1) {
        return NextResponse.json({ error: 'Номер должен быть целым положительным' }, { status: 400 });
    }
    if (!Number.isInteger(data.year) || data.year < 1900 || data.year > 2100) {
        return NextResponse.json({ error: 'Год должен быть в диапазоне 1900–2100' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Если ставим текущим — снимаем флаг с прежнего
        if (data.is_current) {
            await client.query(`UPDATE issues SET is_current = FALSE WHERE is_current = TRUE`);
        }

        const res = await client.query(
            `INSERT INTO issues
         (volume, number, year, title_ru, title_en, published_at, cover_url, is_current)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
            [
                data.volume,
                data.number,
                data.year,
                data.title_ru?.trim() || null,
                data.title_en?.trim() || null,
                data.published_at || null,
                data.cover_url?.trim() || null,
                !!data.is_current,
            ]
        );

        await client.query('COMMIT');
        return NextResponse.json({ ok: true, id: res.rows[0].id });
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