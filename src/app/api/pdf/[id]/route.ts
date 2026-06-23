import { NextRequest, NextResponse } from 'next/server';
import { stat, readFile } from 'node:fs/promises';
import path from 'node:path';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    // UUID-валидация (защита от мусора в URL)
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
        return new NextResponse('Bad request', { status: 400 });
    }

    // 1. Достаём путь из БД
    const [article] = await query<{ pdf_path: string | null; status: string; title_ru: string }>(
        `SELECT pdf_path, status, title_ru FROM articles WHERE id = $1`,
        [id]
    );

    if (!article) {
        return new NextResponse('Not found', { status: 404 });
    }
    if (!article.pdf_path) {
        return new NextResponse('PDF не загружен', { status: 404 });
    }

    // (Опционально) ограничить доступ к черновикам.
    // Раскомментируй, когда будет готов:
    // if (article.status !== 'published') {
    //   const token = (await cookies()).get('auth_token')?.value;
    //   if (!token) return new NextResponse('Forbidden', { status: 403 });
    // }

    // 2. Защита от path traversal — собираем абсолютный путь и проверяем,
    //    что он внутри uploadRoot.
    const uploadDir = process.env.UPLOAD_DIR || 'uploads';
    const uploadRoot = path.resolve(process.cwd(), uploadDir);
    const absPath = path.resolve(process.cwd(), article.pdf_path);

    if (absPath !== uploadRoot && !absPath.startsWith(uploadRoot + path.sep)) {
        return new NextResponse('Forbidden', { status: 403 });
    }

    // 3. Читаем файл и отдаём
    try {
        const st = await stat(absPath);
        if (!st.isFile()) {
            return new NextResponse('Not found', { status: 404 });
        }

        const data = await readFile(absPath);

        // Имя файла для скачивания — на основе заголовка статьи
        const filename = sanitizeFilename(article.title_ru) + '.pdf';

        return new NextResponse(data, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Length': st.size.toString(),
                // inline — открыть в браузере; attachment — принудительное скачивание
                'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(filename)}`,
                'Cache-Control': 'public, max-age=3600',
            },
        });
    } catch (e) {
        console.error('PDF read error:', e);
        return new NextResponse('Not found', { status: 404 });
    }
}

function sanitizeFilename(name: string): string {
    return name
        .replace(/[\/\\?%*:|"<>]/g, '')
        .replace(/\s+/g, '_')
        .slice(0, 100) || 'article';
}