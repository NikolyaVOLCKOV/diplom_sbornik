const NAV = [
    { label: 'Дашборд',  href: '/admin' },
    { label: 'Статьи',   href: '/admin/articles' },

    { label: '+ Статья', href: '/admin/articles/new' },
];
export default function AdminHeader() {
    return (
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
          <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
            ГИЦР — Админка
          </span>
                    <nav style={{ display: 'flex', gap: 4 }}>
                        {NAV.map(({ label, href }) => (
                            <a key={label} href={href} style={{ fontSize: 13, color: 'var(--ink3)', padding: '6px 12px', borderRadius: 4, textDecoration: 'none' }}>
                                {label}
                            </a>
                        ))}
                    </nav>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <a href="/" style={{ fontSize: 13, color: 'var(--ink3)' }}>← Сайт</a>
                    <a href="/api/auth/logout" style={{ fontSize: 13, color: '#fff', background: 'var(--burgundy)', padding: '6px 14px', borderRadius: 4 }}>
                        Выйти
                    </a>
                </div>
            </div>
        </header>
    );
}