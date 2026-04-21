export default function Header() {
    return (
        <header style={{ background: '#fff', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100 }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', display: 'flex', alignItems: 'center', height: 64, gap: 32 }}>
                <a href="/" style={{ fontFamily: 'Playfair Display, serif', fontSize: 14, fontWeight: 700, lineHeight: 1.25, maxWidth: 280, color: 'var(--ink)' }}>
                    Гуманитарные исследования Центральной России
                </a>
                <nav style={{ display: 'flex', gap: 2, flex: 1 }}>
                    <a href="/about" style={{ fontSize: 13, color: 'var(--ink3)', padding: '8px 12px', borderRadius: 4 }}>О журнале</a>
                    <a href="/current" style={{ fontSize: 13, color: 'var(--ink3)', padding: '8px 12px', borderRadius: 4 }}>Текущий выпуск</a>
                    <a href="/archive" style={{ fontSize: 13, color: 'var(--ink3)', padding: '8px 12px', borderRadius: 4 }}>Архив</a>
                    <a href="/rules" style={{ fontSize: 13, color: 'var(--ink3)', padding: '8px 12px', borderRadius: 4 }}>Правила</a>
                    <a href="/ethics" style={{ fontSize: 13, color: 'var(--ink3)', padding: '8px 12px', borderRadius: 4 }}>Этика</a>
                </nav>
                <a href="/submit" style={{ background: 'var(--burgundy)', color: '#fff', borderRadius: 4, padding: '7px 16px', fontSize: 13, fontWeight: 500 }}>
                    Подать статью
                </a>
            </div>
        </header>
    )
}