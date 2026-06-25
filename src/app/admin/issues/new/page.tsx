import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminHeader from '../../_components/AdminHeader';
import IssueForm from '../../_components/IssueForm';

export default async function NewIssuePage() {
    const cookieStore = await cookies();
    if (!cookieStore.get('auth_token')) redirect('/login');

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
                        Новый выпуск
                    </h1>
                </div>

                <IssueForm />
            </main>
        </div>
    );
}