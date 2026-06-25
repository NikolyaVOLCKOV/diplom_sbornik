import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminHeader from "./_components/AdminHeader";
import DeleteButton from './_components/DeleteButton';


export const dynamic = 'force-dynamic';

type IssueRow = {
    id: string;
    volume: number;
    number: number;
    year: number;
    title_ru: string | null;
    published_at: string | null;
    is_current: boolean;
    article_count: number;
};

async function getIssues() {
    return query<IssueRow>(`
    SELECT
      i.id, i.volume, i.number, i.year, i.title_ru,
      i.published_at, i.is_current,
      (SELECT COUNT(*) FROM articles WHERE issue_id = i.id) AS article_count
    FROM issues i
    ORDER BY i.year DESC, i.volume DESC, i.number DESC
  `);
}

export default async function IssuesAdminPage() {
    const cookieStore = await cookies();
    if (!cookieStore.get('auth_token')) redirect('/login');

    const issues = await getIssues();

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
                        Выпуски
                    </h1>

                   <a href="/admin/issues/new"
                    style={{
                    fontSize: 13, color: '#fff', background: 'var(--burgundy)',
                    padding: '8px 18px', borderRadius: 4, fontWeight: 500,
                    textDecoration: 'none',
                }}
                    >
                    + Новый выпуск
                </a>
        </div>

    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 6 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
            <tr style={{ background: 'var(--paper2)' }}>
                {['Выпуск', 'Название', 'Опубликован', 'Статей', 'Статус', 'Действия'].map(h => (
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
            {issues.map((i, idx) => (
                <tr key={i.id} style={{
                    borderBottom: idx < issues.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                    <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 500, color: 'var(--ink)', whiteSpace: 'nowrap' }}>
                        Т.{i.volume} №{i.number} <span style={{ color: 'var(--ink3)' }}>({i.year})</span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--ink2)' }}>
                        {i.title_ru || <span style={{ color: 'var(--ink3)' }}>—</span>}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--ink3)' }}>
                        {i.published_at ? new Date(i.published_at).toLocaleDateString('ru-RU') : '—'}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--ink2)' }}>
                        {Number(i.article_count)}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                        {i.is_current ? (
                            <span style={{
                                fontSize: 11, fontWeight: 600, padding: '3px 8px',
                                borderRadius: 3, color: '#166534', background: '#dcfce7',
                            }}>
                        Текущий
                      </span>
                        ) : (
                            <span style={{ fontSize: 11, color: 'var(--ink3)' }}>—</span>
                        )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', gap: 8 }}>

                           <a href={`/issue/${i.volume}/${i.number}`}
                            style={{
                            fontSize: 12, color: 'var(--burgundy)',
                            textDecoration: 'none', padding: '4px 10px',
                            border: '1px solid var(--burgundy)', borderRadius: 3,
                        }}
                            >
                            Просмотр
                        </a>

                        <a href={`/admin/issues/${i.id}/edit`}
                        style={{
                        fontSize: 12, color: 'var(--ink2)',
                        textDecoration: 'none', padding: '4px 10px',
                        border: '1px solid var(--border)', borderRadius: 3,
                        background: '#fff',
                    }}
                        >
                        Изменить
                    </a>
                    <DeleteButton
                        id={i.id}
                        label={`Т.${i.volume} №${i.number}`}
                        canDelete={Number(i.article_count) === 0}
                    />
                </div>
                </td>
                </tr>
                ))}
            {issues.length === 0 && (
                <tr>
                    <td colSpan={6} style={{ padding: 40, textAlign: 'center', fontSize: 14, color: 'var(--ink3)' }}>
                        Выпусков пока нет
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