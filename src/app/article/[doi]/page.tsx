import { query } from '@/lib/db'
import { notFound } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
async function getArticle(doi: string) {
    const decoded = decodeURIComponent(doi)
    const rows = await query(`
    SELECT
      a.*,
      i.number      AS issue_number,
      i.volume      AS issue_volume,
      i.year        AS issue_year,
      i.title_ru    AS issue_title,
      s.name_ru     AS section_name,
      s.slug        AS section_slug,
      s.vak_code,
      (
        SELECT JSON_AGG(
          JSON_BUILD_OBJECT(
            'last_name',   au.last_name_ru,
            'first_name',  au.first_name_ru,
            'middle_name', au.middle_name_ru,
            'orcid',       au.orcid,
            'affiliation', af.name_ru,
            'order',       aa.author_order
          ) ORDER BY aa.author_order
        )
        FROM article_authors aa
        JOIN authors au ON aa.author_id = au.id
        LEFT JOIN affiliations af ON aa.affiliation_id = af.id
        WHERE aa.article_id = a.id
      ) AS authors,
      (
        SELECT JSON_AGG(k.word_ru ORDER BY k.word_ru)
        FROM article_keywords ak
        JOIN keywords k ON ak.keyword_id = k.id
        WHERE ak.article_id = a.id
      ) AS keywords
    FROM articles a
    JOIN issues   i ON a.issue_id   = i.id
    JOIN sections s ON a.section_id = s.id
    WHERE a.doi = $1 AND a.status = 'published'
    LIMIT 1
  `, [decoded])
    return rows[0] || null
}

async function getRelatedArticles(articleId: string, sectionId: string) {
    return query(`
    SELECT a.id, a.title_ru, a.doi,
      (
        SELECT au.last_name_ru
        FROM article_authors aa JOIN authors au ON aa.author_id = au.id
        WHERE aa.article_id = a.id AND aa.author_order = 1 LIMIT 1
      ) AS first_author
    FROM articles a
    WHERE a.section_id = $1
      AND a.id != $2
      AND a.status = 'published'
    ORDER BY a.pages_from
    LIMIT 4
  `, [sectionId, articleId])
}

export default async function ArticlePage({
                                              params,
                                          }: {
    params: { doi: string }
}) {
    const { doi } = await params
    const article = await getArticle(doi)
    if (!article) notFound()

    const related = await getRelatedArticles(article.id, article.section_id)

    const authors: any[] = article.authors || []
    const keywords: string[] = article.keywords || []

    return (
        <main style={{ background: 'var(--paper)', minHeight: '100vh' }}>

            {/* HEADER */}
            <Header />

            {/* BREADCRUMB */}
            <div style={{ borderBottom: '1px solid var(--border)', background: '#fff' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '10px 32px', fontSize: 12, color: 'var(--ink3)', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <a href="/" style={{ color: 'var(--burgundy)' }}>Главная</a>
                    <span>›</span>
                    <a href={`/issue/${article.issue_volume}/${article.issue_number}`} style={{ color: 'var(--burgundy)' }}>
                        Выпуск {article.issue_number} ({article.issue_volume}) {article.issue_year}
                    </a>
                    <span>›</span>
                    <span>{article.section_name}</span>
                </div>
            </div>

            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 32px', display: 'grid', gridTemplateColumns: '1fr 300px', gap: 48 }}>

                {/* ОСНОВНОЙ КОНТЕНТ */}
                <article>

                    {/* Раздел */}
                    <div style={{ fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--burgundy)', fontWeight: 600, marginBottom: 16 }}>
                        {article.section_name}
                        {article.vak_code && <span style={{ color: 'var(--ink3)', marginLeft: 8 }}>· ВАК {article.vak_code}</span>}
                    </div>

                    {/* Заголовок */}
                    <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 700, lineHeight: 1.25, marginBottom: 24, color: 'var(--ink)' }}>
                        {article.title_ru}
                    </h1>

                    {/* Авторы */}
                    <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
                        {authors.map((author, i) => (
                            <div key={i} style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)' }}>
                  {author.last_name} {author.first_name} {author.middle_name || ''}
                </span>
                                {author.orcid && (
                                    <a href={`https://orcid.org/${author.orcid}`} target="_blank"
                                       style={{ marginLeft: 8, fontSize: 11, color: '#a6ce39', border: '1px solid #a6ce39', borderRadius: 3, padding: '1px 6px' }}>
                                        ORCID
                                    </a>
                                )}
                                {author.affiliation && (
                                    <div style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 2 }}>
                                        {author.affiliation}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Кнопки скачивания */}
                    <div style={{ display: 'flex', gap: 10, marginBottom: 32, flexWrap: 'wrap' }}>
                        {article.pdf_path && (
                            <a href={`/api/pdf/${article.id}`}
                               style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--burgundy)', color: '#fff', padding: '10px 20px', borderRadius: 4, fontSize: 14, fontWeight: 500 }}>
                                ↓ Скачать PDF
                            </a>
                        )}
                        {!article.pdf_path && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--paper2)', color: 'var(--ink3)', padding: '10px 20px', borderRadius: 4, fontSize: 14, border: '1px solid var(--border)' }}>
                PDF недоступен
              </span>
                        )}
                        <a href={`/api/jats/${article.id}`}
                           style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f4f8f4', color: '#2a5a2a', padding: '10px 20px', borderRadius: 4, fontSize: 14, border: '1px solid #c0d0c0' }}>
                            &lt;/&gt; JATS XML
                        </a>
                    </div>

                    {/* Аннотация */}
                    {article.abstract_ru && (
                        <div style={{ marginBottom: 32 }}>
                            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 16, fontWeight: 700, marginBottom: 12, color: 'var(--ink)' }}>
                                Аннотация
                            </h2>
                            <p style={{ fontFamily: 'Lora, serif', fontSize: 15, lineHeight: 1.8, color: 'var(--ink2)', background: 'var(--paper2)', padding: 20, borderLeft: '3px solid var(--burgundy)', borderRadius: '0 4px 4px 0' }}>
                                {article.abstract_ru}
                            </p>
                        </div>
                    )}

                    {/* Английская аннотация */}
                    {article.abstract_en && (
                        <div style={{ marginBottom: 32 }}>
                            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 16, fontWeight: 700, marginBottom: 12, color: 'var(--ink)' }}>
                                Abstract
                            </h2>
                            <p style={{ fontFamily: 'Lora, serif', fontSize: 15, lineHeight: 1.8, color: 'var(--ink2)', background: '#f0f4f8', padding: 20, borderLeft: '3px solid #1a3a5c', borderRadius: '0 4px 4px 0' }}>
                                {article.abstract_en}
                            </p>
                        </div>
                    )}

                    {/* Ключевые слова */}
                    {keywords.length > 0 && (
                        <div style={{ marginBottom: 32 }}>
                            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
                                Ключевые слова
                            </h2>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {keywords.map((kw: string, i: number) => (
                                    <span key={i} style={{ fontSize: 13, padding: '4px 12px', border: '1px solid var(--border)', borderRadius: 20, color: 'var(--ink3)', background: '#fff' }}>
                    {kw}
                  </span>
                                ))}
                            </div>
                        </div>
                    )}

                </article>

                {/* САЙДБАР */}
                <aside>

                    {/* Метаданные */}
                    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 4, padding: 20, marginBottom: 20 }}>
                        <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 14, fontWeight: 700, marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                            Информация о статье
                        </h3>
                        <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                            <tbody>
                            {[
                                { label: 'DOI', value: article.doi },
                                { label: 'Выпуск', value: `${article.issue_number} (${article.issue_volume}) ${article.issue_year}` },
                                { label: 'Страницы', value: `${article.pages_from}–${article.pages_to}` },
                                { label: 'Раздел', value: article.section_name },
                                { label: 'ВАК', value: article.vak_code },
                                { label: 'Опубликована', value: article.published_at ? new Date(article.published_at).toLocaleDateString('ru-RU') : '—' },
                            ].filter(r => r.value).map(({ label, value }) => (
                                <tr key={label}>
                                    <td style={{ padding: '6px 0', color: 'var(--ink3)', paddingRight: 12, verticalAlign: 'top', whiteSpace: 'nowrap' }}>{label}</td>
                                    <td style={{ padding: '6px 0', color: 'var(--ink2)', fontFamily: label === 'DOI' ? 'monospace' : 'inherit', fontSize: label === 'DOI' ? 11 : 12, borderBottom: '1px solid var(--border)', wordBreak: 'break-all' }}>{value}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Цитирование */}
                    <div style={{ background: 'var(--paper2)', border: '1px solid var(--border)', borderRadius: 4, padding: 20, marginBottom: 20 }}>
                        <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 14, fontWeight: 700, marginBottom: 10 }}>
                            Как цитировать
                        </h3>
                        <p style={{ fontSize: 12, color: 'var(--ink2)', lineHeight: 1.6, fontFamily: 'Lora, serif', fontStyle: 'italic' }}>
                            {authors[0]?.last_name} {authors[0]?.first_name?.[0]}.
                            {authors[0]?.middle_name?.[0] ? `${authors[0].middle_name[0]}.` : ''}{' '}
                            {article.title_ru} // Гуманитарные исследования Центральной России.{' '}
                            {article.issue_year}. №{article.issue_number} ({article.issue_volume}).{' '}
                            С. {article.pages_from}–{article.pages_to}.{' '}
                            DOI: {article.doi}
                        </p>
                    </div>

                    {/* Похожие статьи */}
                    {related.length > 0 && (
                        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 4, padding: 20 }}>
                            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 14, fontWeight: 700, marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                                Статьи из этого раздела
                            </h3>
                            {related.map((r: any) => (
                                <a key={r.id} href={`/article/${encodeURIComponent(r.doi)}`}
                                   style={{ display: 'block', paddingBottom: 10, marginBottom: 10, borderBottom: '1px solid var(--border)' }}>
                                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)', lineHeight: 1.4, marginBottom: 3 }}>
                                        {r.title_ru}
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--ink3)' }}>{r.first_author}</div>
                                </a>
                            ))}
                        </div>
                    )}

                </aside>
            </div>

            {/* FOOTER */}
            <Footer />

        </main>
    )
}