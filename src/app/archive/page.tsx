import { query } from '@/lib/db'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

async function getAllIssues() {
    return query(`
    SELECT
      i.id, i.number, i.volume, i.year, i.title_ru, i.published_at, i.is_current,
      COUNT(a.id) AS article_count,
      ARRAY_AGG(DISTINCT s.name_ru) FILTER (WHERE s.name_ru IS NOT NULL) AS sections
    FROM issues i
    LEFT JOIN articles a ON a.issue_id = i.id AND a.status = 'published'
    LEFT JOIN sections s ON a.section_id = s.id
    GROUP BY i.id, i.number, i.volume, i.year, i.title_ru, i.published_at, i.is_current
    ORDER BY i.year DESC, i.number DESC
  `)
}

const gradients = [
    'linear-gradient(135deg, #141414, #7a1b1b)',
    'linear-gradient(135deg, #1a2e4a, #2a1a3a)',
    'linear-gradient(135deg, #1a3a2a, #0a2a3a)',
    'linear-gradient(135deg, #2a1a1a, #3a2a0a)',
    'linear-gradient(135deg, #141428, #2a1428)',
    'linear-gradient(135deg, #1a2814, #0a2828)',
    'linear-gradient(135deg, #281414, #142828)',
    'linear-gradient(135deg, #1a1a2e, #2e1a1a)',
]

export default async function ArchivePage() {
    const issues = await getAllIssues()

    // Группируем по годам
    const byYear: Record<number, any[]> = {}
    for (const issue of issues) {
        if (!byYear[issue.year]) byYear[issue.year] = []
        byYear[issue.year].push(issue)
    }
    const years = Object.keys(byYear).map(Number).sort((a, b) => b - a)

    return (
        <main style={{ background: 'var(--paper)', minHeight: '100vh' }}>
            <Header />

            {/* HERO */}
            <div style={{ background: '#141414', color: '#fff', padding: '48px 0' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
                    <div style={{ fontSize: 11, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>
                        Архив
                    </div>
                    <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 700, marginBottom: 12 }}>
                        Все выпуски журнала
                    </h1>
                    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
                        {issues.length} выпусков · с 2018 года по настоящее время
                    </p>
                </div>
            </div>

            {/* ВЫПУСКИ ПО ГОДАМ */}
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 32px' }}>
                {years.map(year => (
                    <div key={year} style={{ marginBottom: 48 }}>

                        {/* Год */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24,
                            paddingBottom: 12, borderBottom: '2px solid var(--ink)',
                        }}>
                            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 700 }}>
                                {year}
                            </h2>
                            <span style={{ fontSize: 13, color: 'var(--ink3)' }}>
                {byYear[year].length} {byYear[year].length === 1 ? 'выпуск' : 'выпуска'}
              </span>
                        </div>

                        {/* Сетка выпусков */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
                            {byYear[year].map((issue: any, idx: number) => (
                                <a key={issue.id}
                                   href={`/issue/${issue.volume}/${issue.number}`}
                                   style={{ textDecoration: 'none', display: 'block' }}>
                                    <div className="issue-card" style={{
                                        border: issue.is_current ? '2px solid var(--burgundy)' : '1px solid var(--border)',
                                        borderRadius: 6, overflow: 'hidden', background: '#fff',
                                        transition: 'transform .15s, box-shadow .15s',
                                    }}
                                         >

                                        {/* Обложка */}
                                        <div style={{
                                            height: 140,
                                            background: gradients[idx % gradients.length],
                                            display: 'flex', flexDirection: 'column',
                                            alignItems: 'center', justifyContent: 'center',
                                            color: '#fff', position: 'relative', overflow: 'hidden',
                                        }}>
                                            {issue.is_current && (
                                                <div style={{
                                                    position: 'absolute', top: 12, right: 12,
                                                    background: 'var(--burgundy)', fontSize: 10,
                                                    padding: '3px 8px', borderRadius: 3,
                                                    letterSpacing: '1px', textTransform: 'uppercase',
                                                }}>
                                                    Текущий
                                                </div>
                                            )}
                                            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 40, fontWeight: 700, lineHeight: 1 }}>
                                                {issue.volume}
                                            </div>
                                            <div style={{ fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                                                №{issue.number} · {issue.year}
                                            </div>
                                        </div>

                                        {/* Информация */}
                                        <div style={{ padding: '16px 18px' }}>
                                            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 15, fontWeight: 600, marginBottom: 6, color: 'var(--ink)' }}>
                                                Выпуск {issue.number} ({issue.volume})
                                            </div>
                                            <div style={{ fontSize: 12, color: 'var(--ink3)', marginBottom: 10 }}>
                                                {String(issue.article_count)} статей
                                                {issue.published_at && (
                                                    <span> · {new Date(issue.published_at).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}</span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: 12, color: 'var(--burgundy)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                Открыть выпуск →
                                            </div>
                                        </div>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <Footer />
        </main>
    )
}