import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function ArticleNotFound() {
    return (
        <main style={{ background: 'var(--paper)', minHeight: '100vh' }}>
            <Header />
            <div style={{ maxWidth: 700, margin: '0 auto', padding: '80px 32px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 96, fontWeight: 700, color: 'var(--burgundy)', lineHeight: 1, marginBottom: 16 }}>
                    404
                </div>
                <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 700, color: 'var(--ink)', marginBottom: 12 }}>
                    Статья не найдена
                </h1>
                <p style={{ fontFamily: 'Lora, serif', fontSize: 15, color: 'var(--ink2)', lineHeight: 1.7, marginBottom: 32 }}>
                    Возможно, указан неверный DOI, статья ещё не опубликована или была отозвана.
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                    <a href="/" style={{ background: 'var(--burgundy)', color: '#fff', padding: '10px 24px', borderRadius: 4, fontSize: 14, textDecoration: 'none' }}>
                        На главную
                    </a>
                    <a href="/archive" style={{ background: '#fff', color: 'var(--burgundy)', border: '1px solid var(--burgundy)', padding: '10px 24px', borderRadius: 4, fontSize: 14, textDecoration: 'none' }}>
                        Архив выпусков
                    </a>
                </div>
            </div>
            <Footer />
        </main>
    )
}