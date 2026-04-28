import { query } from '@/lib/db'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

async function getIssues() {
    return query(`
    SELECT
      i.id, i.volume, i.number, i.year, i.title_ru, i.is_current,
      COUNT(a.id) AS article_count
    FROM issues i
    LEFT JOIN articles a ON a.issue_id = i.id
    GROUP BY i.id
    ORDER BY i.year DESC, i.number DESC
  `)
}

export default async function IssuesPage() {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')
    if (!token) redirect('/login')

    const issues = await getIssues()

    return (
        <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
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
                                { label: 'Дашборд',   href: '/admin' },
                                { label: 'Выпуски',   href: '/admin/issues' },
                                { label: '+ Статья',  href: '/admin/articles/new' },
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
                <div style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', marginBottom: 28,
                }}>
                    <div>
                        <a href="/admin" style={{ fontSize: 13, color: 'var(--ink3)' }}>← Дашборд</a>
                        <h1 style={{
                            fontFamily: 'Playfair Display, serif',
                            fontSize: 26, fontWeight: 700, color: 'var(--ink)',
                            margin: '12px 0 0',
                        }}>
                            Выпуски
                        </h1>
                    </div>
                    <a href="/admin/issues/new" style={{
                        fontSize: 14, fontWeight: 600, color: '#fff',
                        background: 'var(--burgundy)', border: 'none',
                        padding: '10px 24px', borderRadius: 4, textDecoration: 'none',
                    }}>
                        + Новый выпуск
                    </a>
                </div>

                <div style={{
                    background: '#fff', border: '1px solid var(--border)', borderRadius: 6,
                }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                        <tr style={{ background: 'var(--paper2)' }}>
                            {['Том / Номер', 'Год', 'Название', 'Статей', 'Статус', 'Действия'].map(h => (
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
                        {issues.map((issue: any, i: number) => (
                            <tr key={issue.id} style={{
                                borderBottom: i < issues.length - 1 ? '1px solid var(--border)' : 'none',
                                background: issue.is_current ? '#fffbf5' : '#fff',
                            }}>
                                <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
                      Том {issue.volume}, № {issue.number}
                    </span>
                                </td>
                                <td style={{ padding: '14px 16px' }}>
                                    <span style={{ fontSize: 14, color: 'var(--ink)' }}>{issue.year}</span>
                                </td>
                                <td style={{ padding: '14px 16px', maxWidth: 300 }}>
                    <span style={{ fontSize: 13, color: 'var(--ink3)' }}>
                      {issue.title_ru || '—'}
                    </span>
                                </td>
                                <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: 13, color: 'var(--ink3)' }}>
                      {issue.article_count}
                    </span>
                                </td>
                                <td style={{ padding: '14px 16px' }}>
                                    {issue.is_current ? (
                                        <span style={{
                                            fontSize: 11, fontWeight: 600, padding: '3px 8px',
                                            borderRadius: 3, color: '#166534', background: '#dcfce7',
                                        }}>
                        Текущий
                      </span>
                                    ) : (
                                        <span style={{
                                            fontSize: 11, fontWeight: 600, padding: '3px 8px',
                                            borderRadius: 3, color: 'var(--ink3)', background: 'var(--paper2)',
                                        }}>
                        Архив
                      </span>
                                    )}
                                </td>
                                <td style={{ padding: '14px 16px' }}>
                                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                        <a href={`/issue/${issue.volume}/${issue.number}`} style={{
                                            fontSize: 12, color: 'var(--burgundy)',
                                        }}>
                                            Просмотр
                                        </a>
                                        <a href={`/admin/issues/${issue.id}/edit`} style={{
                                            fontSize: 12, color: 'var(--ink3)',
                                        }}>
                                            Изменить
                                        </a>
                                        {!issue.is_current && (
                                            <form action={`/api/admin/issues/${issue.id}/set-current`} method="POST">
                                                <button type="submit" style={{
                                                    fontSize: 12, color: '#1e40af',
                                                    background: 'none', border: 'none',
                                                    cursor: 'pointer', padding: 0,
                                                }}>
                                                    Сделать текущим
                                                </button>
                                            </form>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    )
}