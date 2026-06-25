import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { generateJatsXml, jatsFilename } from '@/lib/jats';

export const runtime = 'nodejs';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    // UUID-валидация
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
        return new NextResponse('Bad request', { status: 400 });
    }

    // Тянем DOI для имени файла отдельным запросом — генератор тоже сделает свой,
    // но он нам нужен заранее для Content-Disposition
    const [meta] = await query<{ doi: string | null }>(
        `SELECT doi FROM articles WHERE id = $1 AND status = 'published'`,
        [id]
    );
    if (!meta) {
        return new NextResponse('Not found', { status: 404 });
    }

    let xml: string | null;
    try {
        xml = await generateJatsXml(id);
    } catch (e) {
        console.error('JATS generation error:', e);
        return new NextResponse('Generation error', { status: 500 });
    }

    if (!xml) {
        return new NextResponse('Not found', { status: 404 });
    }

    // По умолчанию — скачивание. Для просмотра в браузере: ?inline=1
    const inline = req.nextUrl.searchParams.get('inline') === '1';
    const filename = jatsFilename(meta.doi, id);
    const disposition = inline
        ? `inline; filename*=UTF-8''${encodeURIComponent(filename)}`
        : `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`;

    return new NextResponse(xml, {
        status: 200,
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Content-Disposition': disposition,
            'Cache-Control': 'public, max-age=300',
        },
    });
}