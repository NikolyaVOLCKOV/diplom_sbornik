import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminHeader from '../_components/AdminHeader';

export const dynamic = 'force-dynamic';

type ArticleRow = {
    id: string;
    title_ru: string;
    doi: string | null;
    status: string;
    pages_from: number | null;
    pages_to: number | null;
    created_at: string;
    issue_volume: number | null;
    issue_number: number | null;
    issue_year: number | null;
    section_name: string | null;
    first_author: string | null;
};

const statusLabel: Record<string, { label: string; color: string; bg: string }> = {
    published: { label: 'Опубликована', color: '#166534', bg: '#dcfce7' },
    draft:     { label: 'Черновик',     color: '#92400e', bg: '#fef3c7' },
    review:    { label: 'На рецензии',  color: '#1e40af', bg: '#dbeafe' },
    retracted: { label: 'Отозвана',     color: '#991b1b', bg: '#fee2e2' },
};

async function getArticles(filters: { status?: string; q?: string }) {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters.status && filters.status !== 'all') {
        params.push(filters.status);
        conditions.push(`a.status = $${params.length}`);
    }

    if (filters.q?.trim()) {
        params.push(`%${filters.q.trim()}%`);
        conditions.push(`(a.title_ru ILIKE $${params.length} OR a.doi ILIKE $${params.length})`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    return query<ArticleRow>(`
    SELECT
      a.id, a.title_ru, a.doi, a.status,
      a.pages_from, a.pages_to, a.created_at,
      i.volume AS issue_volume, i.number AS issue_number, i.year AS issue_year,
      s.name_ru AS section_name,
      (
        SELECT au.last_name_ru || ' ' || LEFT(au.first_name_ru, 1) || '.'
          || CASE WHEN au.middle_name_ru IS NOT NULL
                  THEN LEFT(au.middle_name_ru, 1) || '.' ELSE '' END
        FROM article_authors aa
        JOIN authors au ON aa.author_id = au.id
        WHERE aa.article_id = a.id AND aa.author_order = 1
        LIMIT 1
      ) AS first_author
    FROM articles a
    LEFT JOIN issues   i ON a.issue_id = i.id
    LEFT JOIN sections s ON a.section_id = s.id
    ${where}
    ORDER BY a.created_at DESC
  `, params);
}

async function getCounts() {
    const [rows] = await query<{ counts: Record<string, number> }>(`
    SELECT JSON_OBJECT_AGG(status, count) AS counts FROM (
      SELECT status, COUNT(*)::int AS count FROM articles GROUP BY status
    ) t
  `);
    const counts = rows?.counts || {};
    const total = Object.values(counts).reduce((s: number, c) => s + Number(c), 0);
    return { counts, total };
}

type SearchParams = Promise<{ status?: string; q?: string }>;

export default async function ArticlesAdminPage({
                                                    searchParams,
                                                }: {
    searchParams: SearchParams;
}) {
    const cookieStore = await cookies();
    if (!cookieStore.get('auth_token')) redirect('/login');

    const { status = 'all', q = '' } = await searchParams;
    const [articles, { counts, total }] = await Promise.all([
        getArticles({ status, q }),
        getCounts(),
    ]);

    const statusTabs = [
        { key: 'all',        label: 'Все',          n: total },
        { key: 'published',  label: 'Опубликованы', n: Number(counts.published || 0) },
        { key: 'draft',      label: 'Черновики',    n: Number(counts.draft || 0) },
        { key: 'review',     label: 'На рецензии',  n: Number(counts.review || 0) },
        { key: 'retracted',  label: 'Отозванные',   n: Number(counts.retracted || 0) },
    ];

    return (
        <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
            <AdminHeader />

            <main style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 32px' }}>
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginBottom: 28,
                }}>
                    <h1 style={{
                        fontFamily: 'Playfair Display, serif',
                        fontSize: 26, fontWeight: 700, color: 'var(--ink)', margin: 0,
                    }}>
                        Статьи
                    </h1>

                    <a href="/admin/articles/new"
                    style={{
                    fontSize: 13, color: '#fff', background: 'var(--burgundy)',
                    padding: '8px 18px', borderRadius: 4, fontWeight: 500,
                    textDecoration: 'none',
                }}
                    >
                    + Новая статья
                </a>
        </div>

{/* Вкладки по статусам */}
    <div style={{
        display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap',
        borderBottom: '1px solid var(--border)',
    }}>
        {statusTabs.map(tab => {
            const active = status === tab.key;
            const href = tab.key === 'all'
                ? (q ? `/admin/articles?q=${encodeURIComponent(q)}` : '/admin/articles')
                : `/admin/articles?status=${tab.key}${q ? `&q=${encodeURIComponent(q)}` : ''}`;
            return (

               <a key={tab.key}
            href={href}
            style={{
                fontSize: 13, padding: '8px 14px',
                    color: active ? 'var(--burgundy)' : 'var(--ink3)',
                    borderBottom: active ? '2px solid var(--burgundy)' : '2px solid transparent',
                    marginBottom: -1,
                    textDecoration: 'none',
                    fontWeight: active ? 600 : 400,
            }}
        >
            {tab.label}{' '}
            <span style={{
                fontSize: 11,
                color: active ? 'var(--burgundy)' : 'var(--ink3)',
                opacity: 0.7,
            }}>
                  {tab.n}
                </span>
        </a>
        );
        })}
    </div>

{/* Поиск (GET-форма, работает без JS) */}
    <form
        method="get"
        action="/admin/articles"
        style={{ display: 'flex', gap: 8, marginBottom: 20 }}
    >
        {status !== 'all' && <input type="hidden" name="status" value={status} />}
        <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Поиск по заголовку или DOI…"
            style={{
                flex: 1, padding: '8px 12px',
                border: '1px solid var(--border)', borderRadius: 4,
                fontSize: 13, fontFamily: 'inherit',
                background: '#fff', color: 'var(--ink)',
                outline: 'none',
            }}
        />
        <button
            type="submit"
            style={{
                background: 'var(--ink2)', color: '#fff', border: 'none',
                padding: '8px 18px', borderRadius: 4, fontSize: 13, cursor: 'pointer',
            }}
        >
            Найти
        </button>
        {q && (

            <a href={status === 'all' ? '/admin/articles' : `/admin/articles?status=${status}`}
            style={{
            fontSize: 13, padding: '8px 14px',
            color: 'var(--ink3)', textDecoration: 'none',
        }}
            >
            Сбросить
            </a>
            )}
    </form>

    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
            <tr style={{ background: 'var(--paper2)' }}>
                {['Название / Автор', 'Раздел', 'Выпуск', 'Статус', 'Действия'].map(h => (
                    <th key={h} style={{
                        padding: '10px 16px', fontSize: 11, fontWeight: 600,
                        color: 'var(--ink3)', textAlign: 'left',
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                        borderBottom: '1px solid var(--border)',
                    }}>
                        {h}
                    </th>
                ))}
            </tr>
            </thead>
            <tbody>
            {articles.map((a, idx) => {
                const st = statusLabel[a.status] || statusLabel.draft;
                return (
                    <tr key={a.id} style={{
                        borderBottom: idx < articles.length - 1 ? '1px solid var(--border)' : 'none',
                    }}>
                        <td style={{ padding: '14px 16px', maxWidth: 360 }}>
                            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', lineHeight: 1.4 }}>
                                {a.title_ru}
                            </div>
                            {a.first_author && (
                                <div style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 3 }}>
                                    {a.first_author}
                                </div>
                            )}
                            {a.doi && (
                                <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 3, fontFamily: 'monospace' }}>
                                    {a.doi}
                                </div>
                            )}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: 12, color: 'var(--ink3)' }}>
                        {a.section_name || '—'}
                      </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: 12, color: 'var(--ink3)' }}>
                        {a.issue_volume && a.issue_number
                            ? `Т.${a.issue_volume} №${a.issue_number}`
                            : '—'}
                      </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                      <span style={{
                          fontSize: 11, fontWeight: 600, padding: '3px 8px',
                          borderRadius: 3, color: st.color, background: st.bg,
                          whiteSpace: 'nowrap',
                      }}>
                        {st.label}
                      </span>
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {a.doi ? (

                                    <a href={`/article/${a.doi}`}
                                    style={{
                                    fontSize: 12, color: 'var(--burgundy)',
                                    textDecoration: 'none', padding: '4px 10px',
                                    border: '1px solid var(--burgundy)', borderRadius: 3,
                                }}
                                    >
                                    Просмотр
                                    </a>
                                    ) : (
                                    <span style={{
                                    fontSize: 12, color: 'var(--ink3)',
                                    padding: '4px 10px',
                                    border: '1px dashed var(--border)', borderRadius: 3,
                                    fontStyle: 'italic',
                                }}>
                                Без DOI
                            </span>
                            )}

                            <a href={`/admin/articles/${a.id}/edit`}
                            style={{
                            fontSize: 12, color: 'var(--ink2)',
                            textDecoration: 'none', padding: '4px 10px',
                            border: '1px solid var(--border)', borderRadius: 3,
                            background: '#fff',
                        }}
                            >
                            Изменить
                        </a>
                    </div>
            </td>
            </tr>
            );
            })}
            {articles.length === 0 && (
                <tr>
                    <td colSpan={5} style={{
                        padding: 40, textAlign: 'center',
                        fontSize: 14, color: 'var(--ink3)',
                    }}>
                        {q
                            ? `По запросу «${q}» ничего не найдено`
                            : status !== 'all'
                                ? 'В этой категории пока нет статей'
                                : 'Статей пока нет'}
                    </td>
                </tr>
            )}
            </tbody>
        </table>
    </div>
</main>
</div>
);
}