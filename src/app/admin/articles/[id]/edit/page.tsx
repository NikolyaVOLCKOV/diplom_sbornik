import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import ArticleForm, { type ArticleInitialValues } from '../../_components/ArticleForm';

type Params = Promise<{ id: string }>;

export default async function EditArticlePage({ params }: { params: Params }) {
    const cookieStore = await cookies();
    if (!cookieStore.get('auth_token')) redirect('/login');

    const { id } = await params;

    const [article] = await query<{
        id: string;
        title_ru: string;
        title_en: string | null;
        abstract_ru: string | null;
        abstract_en: string | null;
        doi: string | null;
        pages_from: number | null;
        pages_to: number | null;
        status: 'draft' | 'review' | 'published' | 'retracted';
        issue_id: string;
        section_id: string;
        pdf_path: string | null;
    }>(
        `SELECT id, title_ru, title_en, abstract_ru, abstract_en, doi,
            pages_from, pages_to, status, issue_id, section_id, pdf_path
       FROM articles
      WHERE id = $1`,
        [id]
    );
    if (!article) notFound();

    const [issues, sections, authorRows, kwRows] = await Promise.all([
        query(
            `SELECT id, volume, number, year, title_ru
         FROM issues
        ORDER BY year DESC, number DESC`
        ),
        query(
            `SELECT id, name_ru, slug, vak_code
         FROM sections
        ORDER BY sort_order`
        ),
        query<{
            last_name_ru: string;
            first_name_ru: string;
            middle_name_ru: string | null;
            orcid: string | null;
            affiliation: string | null;
        }>(
            `SELECT au.last_name_ru,
              au.first_name_ru,
              au.middle_name_ru,
              au.orcid,
              af.name_ru AS affiliation
         FROM article_authors aa
         JOIN authors au ON aa.author_id = au.id
         LEFT JOIN affiliations af ON aa.affiliation_id = af.id
        WHERE aa.article_id = $1
        ORDER BY aa.author_order`,
            [id]
        ),
        query<{ word_ru: string }>(
            `SELECT k.word_ru
         FROM article_keywords ak
         JOIN keywords k ON ak.keyword_id = k.id
        WHERE ak.article_id = $1
        ORDER BY k.word_ru`,
            [id]
        ),
    ]);

    const initial: ArticleInitialValues = {
        title_ru: article.title_ru,
        title_en: article.title_en,
        abstract_ru: article.abstract_ru ?? '',
        abstract_en: article.abstract_en,
        doi: article.doi,
        issue_id: article.issue_id,
        section_id: article.section_id,
        pages_from: article.pages_from,
        pages_to: article.pages_to,
        status: article.status,
        pdf_path: article.pdf_path,
        keywords: kwRows.map(k => k.word_ru),
        authors: authorRows.map(a => ({
            last_name_ru: a.last_name_ru,
            first_name_ru: a.first_name_ru,
            middle_name_ru: a.middle_name_ru ?? '',
            orcid: a.orcid ?? '',
            affiliation: a.affiliation ?? '',
        })),
    };

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
                        Редактирование статьи
                    </h1>
                    <div style={{ fontSize: 13, color: 'var(--ink3)', marginTop: 6 }}>
                        {article.title_ru}
                    </div>
                </div>

                <ArticleForm
                    issues={issues}
                    sections={sections}
                    initialValues={initial}
                    articleId={article.id}
                />
            </main>
        </div>
    );
}