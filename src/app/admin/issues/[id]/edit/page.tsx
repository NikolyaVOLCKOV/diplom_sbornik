import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import AdminHeader from '../../../_components/AdminHeader';
import IssueForm, { type IssueInitialValues } from '../../../_components/IssueForm';

type Params = Promise<{ id: string }>;

type IssueRow = {
    id: string;
    volume: number;
    number: number;
    year: number;
    title_ru: string | null;
    title_en: string | null;
    published_at: string | null;
    cover_url: string | null;
    is_current: boolean;
};

export default async function EditIssuePage({ params }: { params: Params }) {
    const cookieStore = await cookies();
    if (!cookieStore.get('auth_token')) redirect('/login');

    const { id } = await params;

    const [issue] = await query<IssueRow>(
        `SELECT id, volume, number, year, title_ru, title_en,
            published_at, cover_url, is_current
       FROM issues
      WHERE id = $1`,
        [id]
    );
    if (!issue) notFound();

    const initial: IssueInitialValues = {
        volume: issue.volume,
        number: issue.number,
        year: issue.year,
        title_ru: issue.title_ru,
        title_en: issue.title_en,
        published_at: issue.published_at,
        cover_url: issue.cover_url,
        is_current: issue.is_current,
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
            <AdminHeader />

            <main style={{ maxWidth: 800, margin: '0 auto', padding: '40px 32px' }}>
                <div style={{ marginBottom: 28 }}>
                    <a href="/admin/issues" style={{ fontSize: 13, color: 'var(--ink3)' }}>← К списку выпусков</a>
                    <h1 style={{
                        fontFamily: 'Playfair Display, serif',
                        fontSize: 26, fontWeight: 700, color: 'var(--ink)',
                        margin: '12px 0 0',
                    }}>
                        Редактирование выпуска
                    </h1>
                    <div style={{ fontSize: 13, color: 'var(--ink3)', marginTop: 6 }}>
                        Т.{issue.volume} №{issue.number} ({issue.year})
                    </div>
                </div>

                <IssueForm initialValues={initial} issueId={issue.id} />
            </main>
        </div>
    );
}