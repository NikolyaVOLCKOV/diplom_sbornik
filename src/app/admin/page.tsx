import { query } from '@/lib/db'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

async function getStats() {
    const [articles, issues, authors] = await Promise.all([
        query(`SELECT COUNT(*) AS count FROM articles`),
        query(`SELECT COUNT(*) AS count FROM issues`),
        query(`SELECT COUNT(*) AS count FROM authors`),
    ])
    return {
        articles: Number(articles[0].count),
        issues: Number(issues[0].count),
        authors: Number(authors[0].count),
    }
}

async function getArticles() {
    return query(`
        SELECT
            a.id, a.title_ru, a.doi, a.status, a.pages_from, a.pages_to,
            a.created_at,
            i.volume, i.number, i.year,
            s.name_ru AS section_name,
            (
                SELECT au.last_name_ru || ' ' || LEFT(au.first_name_ru,1) || '.'
            || CASE WHEN au.middle_name_ru IS NOT NULL
            THEN LEFT(au.middle_name_ru,1) || '.' ELSE '' END
        FROM article_authors aa
        JOIN authors au ON aa.author_id = au.id
        WHERE aa.article_id = a.id AND aa.author_order = 1
        LIMIT 1
      ) AS first_author
    FROM articles a
    LEFT JOIN issues i ON a.issue_id = i.id
    LEFT JOIN sections s ON a.section_id = s.id
    ORDER BY a.created_at DESC
    LIMIT 50
    `)
}

async function getCurrentIssue() {
    const rows = await query(`SELECT * FROM issues WHERE is_current = TRUE LIMIT 1`)
    return rows[0]
}

const statusLabel: Record<string, { label: string; color: string; bg: string }> = {
    published: { label: 'Опубликована', color: '#166534', bg: '#dcfce7' },
    draft:     { label: 'Черновик',     color: '#92400e', bg: '#fef3c7' },
    review:    { label: 'На рецензии',  color: '#1e40af', bg: '#dbeafe' },
    retracted: { label: 'Отозвана',     color: '#991b1b', bg: '#fee2e2' },
}

export default async function AdminPage() {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')
    if (!token) redirect('/login')

    const [stats, articles, currentIssue] = await Promise.all([
        getStats(),
        getArticles(),
        getCurrentIssue(),
    ])

    return (
        <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
            {/* Шапка админки */}
            <header style={{
                background: '#fff', borderBottom: '1px solid var(--border)',
                position: 'sticky', top: 0, zIndex: 100,
            }}>
                <div style={{
                    maxWidth: 1200, margin: '0 auto', padding: '0 32px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    height: 64,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <span style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: 14, fontWeight: 700, color: 'var(--ink)',
            }}>
              ГИЦР — Админка
            </span>
                        <nav style={{ display: 'flex', gap: 4 }}>
                            {[
                                { label: 'Дашборд', href: '/admin' },
                                { label: 'Статьи',  href: '/admin' },
                                { label: '+ Статья', href: '/admin/articles/new' },
                            ].map(({ label, href }) => (
                                <a key={label} href={href} style={{
                                    fontSize: 13, color: 'var(--ink3)', padding: '6px 12px',
                                    borderRadius: 4, textDecoration: 'none',
                                }}>
                                    {label}
                                </a>
                            ))}
                        </nav>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <a href="/" style={{ fontSize: 13, color: 'var(--ink3)' }}>← Сайт</a>
                        <a href="/api/auth/logout" style={{
                            fontSize: 13, color: '#fff', background: 'var(--burgundy)',
                            padding: '6px 14px', borderRadius: 4,
                        }}>
                            Выйти
                        </a>
                    </div>
                </div>
            </header>

            <main style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 32px' }}>
                {/* Текущий выпуск */}
                {currentIssue && (
                    <div style={{
                        background: '#fff', border: '1px solid var(--border)',
                        borderLeft: '4px solid var(--burgundy)',
                        borderRadius: 6, padding: '16px 20px', marginBottom: 32,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                        <div>
              <span style={{ fontSize: 11, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Текущий выпуск
              </span>
                            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', marginTop: 2 }}>
                                Том {currentIssue.volume}, № {currentIssue.number} ({currentIssue.year})
                                {currentIssue.title_ru && ` — ${currentIssue.title_ru}`}
                            </div>
                        </div>
                        <a href={`/issue/${currentIssue.volume}/${currentIssue.number}`} style={{
                            fontSize: 13, color: 'var(--burgundy)', border: '1px solid var(--burgundy)',
                            padding: '6px 14px', borderRadius: 4,
                        }}>
                            Открыть выпуск →
                        </a>
                    </div>
                )}

                {/* Статистика */}
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 16, marginBottom: 40,
                }}>
                    {[
                        { label: 'Статей',   value: stats.articles },
                        { label: 'Выпусков', value: stats.issues },
                        { label: 'Авторов',  value: stats.authors },
                    ].map(({ label, value }) => (
                        <div key={label} style={{
                            background: '#fff', border: '1px solid var(--border)',
                            borderRadius: 6, padding: '24px 28px',
                        }}>
                            <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--burgundy)', fontFamily: 'Playfair Display, serif' }}>
                                {value}
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--ink3)', marginTop: 4 }}>{label}</div>
                        </div>
                    ))}
                </div>

                {/* Список статей */}
                <div style={{
                    background: '#fff', border: '1px solid var(--border)', borderRadius: 6,
                }}>
                    <div style={{
                        padding: '20px 24px', borderBottom: '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                        <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                            Статьи
                        </h2>
                        <a href="/admin/articles/new" style={{
                            fontSize: 13, color: '#fff', background: 'var(--burgundy)',
                            padding: '7px 16px', borderRadius: 4, fontWeight: 500,
                        }}>
                            + Добавить статью
                        </a>
                    </div>

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
                        {articles.map((a: any, i: number) => {
                            const st = statusLabel[a.status] || statusLabel.draft
                            return (
                                <tr key={a.id} style={{
                                    borderBottom: i < articles.length - 1 ? '1px solid var(--border)' : 'none',
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
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: 12, color: 'var(--ink3)' }}>
                        {a.section_name || '—'}
                      </span>
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: 12, color: 'var(--ink3)' }}>
                        {a.volume && a.number ? `Т.${a.volume} №${a.number}` : '—'}
                      </span>
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                          fontSize: 11, fontWeight: 600, padding: '3px 8px',
                          borderRadius: 3, color: st.color, background: st.bg,
                      }}>
                        {st.label}
                      </span>
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            {a.doi && (
                                                <a href={`/article/${encodeURIComponent(a.doi)}`}
                                                   style={{ fontSize: 12, color: 'var(--burgundy)' }}>
                                                    Просмотр
                                                </a>
                                            )}
                                            <a href={`/admin/articles/${a.id}/edit`}
                                               style={{ fontSize: 12, color: 'var(--ink3)' }}>
                                                Изменить
                                            </a>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                        {articles.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{
                                    padding: '40px', textAlign: 'center',
                                    fontSize: 14, color: 'var(--ink3)',
                                }}>
                                    Статей пока нет
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    )
}