import { query } from '@/lib/db'
import { notFound } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

async function getIssue(volume: string, number: string) {
    const rows = await query(`
    SELECT * FROM issues
    WHERE volume = $1 AND number = $2
    LIMIT 1
  `, [parseInt(volume), parseInt(number)])
    return rows[0] || null
}

async function getIssueToc(issueId: string) {
    return query(`
    SELECT
      a.id, a.title_ru, a.doi, a.pages_from, a.pages_to, a.abstract_ru, a.pdf_path,
      s.name_ru AS section_name, s.slug AS section_slug, s.sort_order,
      (
        SELECT STRING_AGG(
          au.last_name_ru || ' ' || LEFT(au.first_name_ru,1) || '.' ||
          CASE WHEN au.middle_name_ru IS NOT NULL THEN LEFT(au.middle_name_ru,1) || '.' ELSE '' END,
          ', ' ORDER BY aa.author_order
        )
        FROM article_authors aa
        JOIN authors au ON aa.author_id = au.id
        WHERE aa.article_id = a.id
      ) AS authors,
      (
        SELECT STRING_AGG(af.name_ru, '; ' ORDER BY aa2.author_order)
        FROM article_authors aa2
        JOIN affiliations af ON aa2.affiliation_id = af.id
        WHERE aa2.article_id = a.id
      ) AS affiliations
    FROM articles a
    JOIN sections s ON a.section_id = s.id
    WHERE a.issue_id = $1 AND a.status = 'published'
    ORDER BY s.sort_order, a.pages_from
  `, [issueId])
}

async function getAllIssues() {
    return query(`
    SELECT id, number, volume, year, is_current
    FROM issues
    ORDER BY year DESC, number DESC
  `)
}

export default async function IssuePage({
                                            params,
                                        }: {
    params: Promise<{ volume: string; number: string }>
}) {
    const { volume, number } = await params
    const issue = await getIssue(volume, number)
    if (!issue) notFound()

    const [articles, allIssues] = await Promise.all([
        getIssueToc(issue.id),
        getAllIssues(),
    ])

    // Группируем по разделам
    const sections: Record<string, { name: string; slug: string; articles: any[] }> = {}
    for (const article of articles) {
        if (!sections[article.section_slug]) {
            sections[article.section_slug] = {
                name: article.section_name,
                slug: article.section_slug,
                articles: [],
            }
        }
        sections[article.section_slug].articles.push(article)
    }

    const sectionColors: Record<string, string> = {
        'history-domestic': '#7a1b1b',
        'history-general':  '#1a3a5c',
        'pedagogy-general': '#1a4a2e',
        'pedagogy-methods': '#2e3a1a',
        'sociology':        '#3a1a4a',
    }

    return (
        <main style={{ background: 'var(--paper)', minHeight: '100vh' }}>

            {/* HEADER */}

            <Header />

            {/* HERO ВЫПУСКА */}
            <div style={{ background: '#141414', color: '#fff', padding: '48px 0' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 40, alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: 11, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>
                            Научный журнал · ISSN 2541-9056
                        </div>
                        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 700, marginBottom: 12 }}>
                            Выпуск {issue.number} ({issue.volume})
                        </h1>
                        <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', marginBottom: 20 }}>
                            {issue.year} год · {articles.length} статей · {Object.keys(sections).length} разделов
                        </div>
                        {issue.published_at && (
                            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
                                Опубликован: {new Date(issue.published_at).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </div>
                        )}
                    </div>

                    {/* Навигация по выпускам */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 200 }}>
                        <div style={{ fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>
                            Другие выпуски
                        </div>
                        {allIssues.slice(0, 6).map((i: any) => (
                            <a key={i.id}
                               href={`/issue/${i.volume}/${i.number}`}
                               style={{
                                   fontSize: 12,
                                   padding: '6px 12px',
                                   borderRadius: 4,
                                   color: (i.volume === issue.volume && i.number === issue.number) ? '#fff' : 'rgba(255,255,255,0.5)',
                                   background: (i.volume === issue.volume && i.number === issue.number) ? 'rgba(255,255,255,0.1)' : 'transparent',
                                   border: '1px solid rgba(255,255,255,0.1)',
                               }}>
                                №{i.number} ({i.volume}) · {i.year}
                            </a>
                        ))}
                    </div>
                </div>
            </div>

            {/* ОГЛАВЛЕНИЕ */}
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 32px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 40 }}>

                    {/* СТАТЬИ ПО РАЗДЕЛАМ */}
                    <div>
                        {Object.values(sections).map((section) => (
                            <div key={section.slug} style={{ marginBottom: 48 }}>

                                {/* Заголовок раздела */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
                                    paddingBottom: 12, borderBottom: `2px solid ${sectionColors[section.slug] || 'var(--burgundy)'}`,
                                }}>
                                    <div style={{ width: 4, height: 20, background: sectionColors[section.slug] || 'var(--burgundy)', borderRadius: 2 }} />
                                    <h2 style={{
                                        fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 700,
                                        color: sectionColors[section.slug] || 'var(--burgundy)',
                                    }}>
                                        {section.name}
                                    </h2>
                                    <span style={{ fontSize: 12, color: 'var(--ink3)', marginLeft: 'auto' }}>
                    {section.articles.length} {section.articles.length === 1 ? 'статья' : 'статей'}
                  </span>
                                </div>

                                {/* Статьи раздела */}
                                {section.articles.map((article: any, idx: number) => (
                                    <div key={article.id} style={{
                                        padding: '20px 0',
                                        borderBottom: idx < section.articles.length - 1 ? '1px solid var(--border)' : 'none',
                                        display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'start',
                                    }}>
                                        <div>
                                            {/* Заголовок */}
                                            <a href={`/article/${encodeURIComponent(article.doi)}`}>
                                                <h3 className="article-title" style={{
                                                    fontFamily: 'Playfair Display, serif', fontSize: 16, fontWeight: 600,
                                                    lineHeight: 1.35, marginBottom: 6, color: 'var(--ink)',
                                                    transition: 'color .15s',
                                                }}>
                                                    {article.title_ru}
                                                </h3>
                                            </a>

                                            {/* Авторы */}
                                            <div style={{ fontSize: 13, color: 'var(--ink3)', marginBottom: 6 }}>
                                                {article.authors}
                                            </div>

                                            {/* Аффилиации */}
                                            {article.affiliations && (
                                                <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 8, fontStyle: 'italic' }}>
                                                    {article.affiliations}
                                                </div>
                                            )}

                                            {/* Аннотация */}
                                            {article.abstract_ru && (
                                                <p style={{
                                                    fontSize: 13, color: 'var(--ink2)', lineHeight: 1.65,
                                                    fontFamily: 'Lora, serif', marginBottom: 10,
                                                    display: '-webkit-box', WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                                }}>
                                                    {article.abstract_ru}
                                                </p>
                                            )}

                                            {/* DOI и кнопки */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--ink3)' }}>
                          DOI: {article.doi}
                        </span>
                                                <a href={`/article/${encodeURIComponent(article.doi)}`}
                                                   style={{ fontSize: 11, padding: '3px 10px', border: '1px solid var(--border)', borderRadius: 3, color: 'var(--ink3)' }}>
                                                    Читать
                                                </a>
                                                <a href="#"
                                                   style={{ fontSize: 11, padding: '3px 10px', border: '1px solid #c0d0c0', borderRadius: 3, color: '#2a5a2a', background: '#f4f8f4' }}>
                                                    &lt;/&gt; JATS
                                                </a>
                                            </div>
                                        </div>

                                        {/* Страницы */}
                                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                            <div style={{ fontSize: 12, color: 'var(--ink3)', whiteSpace: 'nowrap' }}>
                                                С. {article.pages_from}–{article.pages_to}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>

                    {/* САЙДБАР */}
                    <aside style={{ position: 'sticky', top: 80, alignSelf: 'start', display: 'flex', flexDirection: 'column', gap: 20 }}>

                        {/* Быстрая навигация по разделам */}
                        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 4, padding: 20 }}>
                            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 14, fontWeight: 700, marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                                Разделы выпуска
                            </h3>
                            {Object.values(sections).map(section => (
                                <a key={section.slug}
                                   href={`#${section.slug}`}
                                   style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: 13, color: 'var(--ink2)' }}>
                  <span style={{ borderLeft: `3px solid ${sectionColors[section.slug] || 'var(--burgundy)'}`, paddingLeft: 8 }}>
                    {section.name}
                  </span>
                                    <span style={{ fontSize: 11, color: 'var(--ink3)', flexShrink: 0, marginLeft: 8 }}>
                    {section.articles.length}
                  </span>
                                </a>
                            ))}
                        </div>

                        {/* Подать статью */}
                        <div style={{ background: '#fff3f3', border: '1px solid #e8c0c0', borderRadius: 4, padding: 20 }}>
                            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 14, fontWeight: 700, color: 'var(--burgundy)', marginBottom: 8 }}>
                                Следующий выпуск
                            </h3>
                            <p style={{ fontSize: 12, color: 'var(--ink3)', marginBottom: 12, lineHeight: 1.6 }}>
                                Принимаем статьи для следующего выпуска. Двойное слепое рецензирование.
                            </p>
                            <a href="#" style={{ display: 'block', background: 'var(--burgundy)', color: '#fff', textAlign: 'center', padding: '9px', borderRadius: 4, fontSize: 13 }}>
                                Подать статью →
                            </a>
                        </div>

                    </aside>
                </div>
            </div>

            {/* FOOTER */}
            <Footer />

        </main>
    )
}