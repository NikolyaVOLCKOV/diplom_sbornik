import { query } from '@/lib/db'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import ArticleForm from '../_components/ArticleForm'
async function getIssues() {
    return query(`
    SELECT id, volume, number, year, title_ru
    FROM issues
    ORDER BY year DESC, number DESC
  `)
}

async function getSections() {
    return query(`
    SELECT id, name_ru, slug, vak_code
    FROM sections
    ORDER BY sort_order
  `)
}

export default async function NewArticlePage() {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')
    if (!token) redirect('/login')

    const [issues, sections] = await Promise.all([getIssues(), getSections()])

    return (
        <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
            {/* Шапка */}
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

            <main style={{ maxWidth: 900, margin: '0 auto', padding: '40px 32px' }}>
                <div style={{ marginBottom: 28 }}>
                    <a href="/admin" style={{ fontSize: 13, color: 'var(--ink3)' }}>← Назад к списку</a>
                    <h1 style={{
                        fontFamily: 'Playfair Display, serif',
                        fontSize: 26, fontWeight: 700, color: 'var(--ink)',
                        margin: '12px 0 0',
                    }}>
                        Новая статья
                    </h1>
                </div>

                <ArticleForm issues={issues} sections={sections} />
            </main>
        </div>
    )
}