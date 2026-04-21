import { query } from '@/lib/db'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

async function getCurrentIssue() {
  return query(`
    SELECT * FROM issues WHERE is_current = TRUE LIMIT 1
  `)
}

async function getLatestArticles() {
  return query(`
    SELECT
      a.id, a.title_ru, a.abstract_ru, a.doi, a.pages_from, a.pages_to,
      s.name_ru AS section_name,
      s.slug AS section_slug,
      (
        SELECT au.last_name_ru || ' ' || LEFT(au.first_name_ru,1) || '.'
               || CASE WHEN au.middle_name_ru IS NOT NULL
                  THEN LEFT(au.middle_name_ru,1) || '.' ELSE '' END
        FROM article_authors aa
        JOIN authors au ON aa.author_id = au.id
        WHERE aa.article_id = a.id AND aa.author_order = 1
        LIMIT 1
      ) AS first_author,
      (
        SELECT STRING_AGG(au2.last_name_ru, ', ' ORDER BY aa2.author_order)
        FROM article_authors aa2
        JOIN authors au2 ON aa2.author_id = au2.id
        WHERE aa2.article_id = a.id
      ) AS all_authors
    FROM articles a
    JOIN issues i ON a.issue_id = i.id
    JOIN sections s ON a.section_id = s.id
    WHERE i.is_current = TRUE AND a.status = 'published'
    ORDER BY s.sort_order, a.pages_from
  `)
}

async function getAllIssues() {
  return query(`
    SELECT id, number, volume, year, title_ru,
      (SELECT COUNT(*) FROM articles WHERE issue_id = issues.id) AS article_count
    FROM issues
    ORDER BY year DESC, number DESC
  `)
}

export default async function Home() {
  const [issues, articles, allIssues] = await Promise.all([
    getCurrentIssue(),
    getLatestArticles(),
    getAllIssues(),
  ])

  const currentIssue = issues[0]
  const heroArticle = articles[0]
  const restArticles = articles.slice(1)

  const sectionColors: Record<string, string> = {
    'history-domestic': '#7a1b1b',
    'history-general':  '#1a3a5c',
    'pedagogy-general': '#1a4a2e',
    'pedagogy-methods': '#2e3a1a',
    'sociology':        '#3a1a4a',
  }

  return (
      <main>
        {/* TOP BAR */}
        <div style={{ background: '#5a1212', color: 'rgba(255,255,255,0.7)', fontSize: 12, padding: '6px 0', textAlign: 'center' }}>
          ВАК · РИНЦ · eLibrary · DOI · Google Scholar · КиберЛенинка &nbsp;|&nbsp; ISSN 2541-9056
        </div>

        {/* HEADER */}
        <Header />

        {/* HERO */}
        {heroArticle && (
            <section style={{ background: '#141414', color: '#fff', padding: '64px 0 56px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
                <div style={{ fontSize: 11, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: 16 }}>
                  Последний выпуск · №{currentIssue?.number} ({currentIssue?.volume}) · {currentIssue?.year}
                </div>
                <a href={`/article/${encodeURIComponent(heroArticle.doi)}`}>
                  <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(22px, 3vw, 36px)', fontWeight: 700, lineHeight: 1.2, maxWidth: 720, marginBottom: 16, color: '#fff' }}>
                    {heroArticle.title_ru}
                  </h1>
                </a>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 12 }}>
                  {heroArticle.all_authors}
                </div>
                {heroArticle.abstract_ru && (
                    <p style={{ fontFamily: 'Lora, serif', fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.75, maxWidth: 680, marginBottom: 24,
                      display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {heroArticle.abstract_ru}
                    </p>
                )}
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <a href="#" style={{ background: 'var(--burgundy)', color: '#fff', padding: '10px 20px', borderRadius: 4, fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>
                    Читать статью
                  </a>
                  <a href="#" style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, textDecoration: 'none' }}>
                    Скачать PDF
                  </a>
                </div>
              </div>
            </section>
        )}

        {/* STATS */}
        <div style={{ background: 'var(--burgundy)', color: '#fff', padding: '28px 0' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', textAlign: 'center' }}>
            {[
              { num: currentIssue?.volume, label: 'Выпусков издано' },
              { num: '680+', label: 'Опубликованных статей' },
              { num: '2018', label: 'Год основания' },
              { num: '4', label: 'Специальности ВАК' },
            ].map(({ num, label }) => (
                <div key={label}>
                  <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 36, fontWeight: 700, lineHeight: 1 }}>{num}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>{label}</div>
                </div>
            ))}
          </div>
        </div>

        {/* ARTICLES */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '40px 0 20px', borderBottom: '2px solid var(--ink)', marginBottom: 28 }}>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700 }}>
              Статьи текущего выпуска
            </h2>
            <a href="#" style={{ fontSize: 13, color: 'var(--burgundy)', textDecoration: 'none' }}>
              Все статьи →
            </a>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32, marginBottom: 48 }}>
            {/* Список статей */}
            <div>
              {restArticles.map((article: any) => (
                  <div key={article.id} style={{ padding: '20px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase', color: sectionColors[article.section_slug] || 'var(--burgundy)', marginBottom: 6, fontWeight: 600 }}>
                      {article.section_name}
                    </div>
                    <a href={`/article/${encodeURIComponent(article.doi)}`}>
                      <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 17, fontWeight: 600, lineHeight: 1.3, marginBottom: 6, color: 'var(--ink)' }}>
                        {article.title_ru}
                      </h3>
                    </a>
                    <div style={{ fontSize: 13, color: 'var(--ink3)', marginBottom: 8 }}>
                      {article.all_authors}
                    </div>
                    {article.abstract_ru && (
                        <p style={{ fontFamily: 'Lora, serif', fontSize: 13.5, color: 'var(--ink2)', lineHeight: 1.7, marginBottom: 8,
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {article.abstract_ru}
                        </p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--ink3)' }}>
                    DOI: {article.doi}
                  </span>
                      <a href="#" style={{ fontSize: 11, padding: '3px 10px', border: '1px solid var(--border)', borderRadius: 3, color: 'var(--ink3)', textDecoration: 'none' }}>PDF</a>
                      <a href="#" style={{ fontSize: 11, padding: '3px 10px', border: '1px solid #c0d0c0', borderRadius: 3, color: '#2a5a2a', background: '#f4f8f4', textDecoration: 'none' }}>&lt;/&gt; JATS</a>
                    </div>
                  </div>
              ))}
            </div>

            {/* Сайдбар */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ background: 'var(--paper2)', border: '1px solid var(--border)', borderRadius: 4, padding: 20 }}>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 14, fontWeight: 700, marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                  Разделы журнала (ВАК)
                </h3>
                {[
                  '5.6.1 Отечественная история',
                  '5.6.2 Всеобщая история',
                  '5.8.1 Общая педагогика',
                  '5.8.7 Технология образования',
                  '5.4 Социология',
                ].map(s => (
                    <div key={s} style={{ fontSize: 12, color: 'var(--ink3)', padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
                      › {s}
                    </div>
                ))}
              </div>

              <div style={{ background: '#fff3f3', border: '1px solid #e8c0c0', borderRadius: 4, padding: 20 }}>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 14, fontWeight: 700, color: 'var(--burgundy)', marginBottom: 8 }}>
                  Подать статью
                </h3>
                <p style={{ fontSize: 13, color: 'var(--ink3)', marginBottom: 12 }}>
                  Принимаем статьи по разделам ВАК 5.6, 5.8, 5.4. Двойное слепое рецензирование.
                </p>
                <a href="#" style={{ display: 'block', background: 'var(--burgundy)', color: '#fff', textAlign: 'center', padding: '9px', borderRadius: 4, fontSize: 13, textDecoration: 'none' }}>
                  Правила для авторов →
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ARCHIVE */}
        <div style={{ background: '#fff', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '40px 0' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700 }}>Архив выпусков</h2>
              <a href="#" style={{ fontSize: 13, color: 'var(--burgundy)', textDecoration: 'none' }}>Весь архив →</a>
            </div>
            <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8 }}>
              {allIssues.map((issue: any) => (
                  <div key={issue.id} style={{ flexShrink: 0, width: 140, border: `1px solid ${issue.is_current ? 'var(--burgundy)' : 'var(--border)'}`, borderRadius: 4, overflow: 'hidden', cursor: 'pointer' }}>
                    <div style={{ height: 100, background: 'linear-gradient(135deg, #141414, #2a1a1a)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                      <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 700 }}>{issue.volume}</div>
                      <div style={{ fontSize: 9, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>№{issue.number} · {issue.year}</div>
                    </div>
                    <div style={{ padding: '10px 12px' }}>
                      <div style={{ fontSize: 11, color: 'var(--ink3)' }}>Выпуск {issue.number} ({issue.volume})</div>
                      <div style={{ fontSize: 10, color: '#9a9a9a' }}>{String(issue.article_count)} статей</div>
                    </div>
                  </div>
              ))}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <Footer />
      </main>
  )
}