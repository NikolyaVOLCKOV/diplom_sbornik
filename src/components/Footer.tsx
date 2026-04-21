export default function Footer() {
    return (
        <footer style={{ background: '#141414', color: 'rgba(255,255,255,0.5)', padding: '48px 0 24px', marginTop: 40 }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 40, marginBottom: 32 }}>
                    <div>
                        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 15, color: '#fff', marginBottom: 8 }}>
                            Гуманитарные исследования Центральной России
                        </div>
                        <p style={{ fontSize: 13, lineHeight: 1.6 }}>
                            Учредитель: Липецкий государственный педагогический университет им. П.П. Семенова-Тян-Шанского
                        </p>
                        <p style={{ fontSize: 12, marginTop: 12, fontFamily: 'monospace', color: 'rgba(255,255,255,0.3)' }}>
                            ISSN 2541-9056 · DOI 10.24412/2541-9056
                        </p>
                    </div>
                    <div>
                        <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 14 }}>
                            Журнал
                        </div>
                        {['О журнале', 'Редколлегия', 'Редполитика', 'Этика публикаций'].map(l => (
                            <a key={l} href="#" style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 8 }}>
                                {l}
                            </a>
                        ))}
                    </div>
                    <div>
                        <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 14 }}>
                            Авторам
                        </div>
                        {['Правила оформления', 'Подать статью', 'Рецензирование', 'JATS XML'].map(l => (
                            <a key={l} href="#" style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 8 }}>
                                {l}
                            </a>
                        ))}
                    </div>
                </div>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 20, fontSize: 12, display: 'flex', justifyContent: 'space-between' }}>
                    <span>© 2018–2026 Гуманитарные исследования Центральной России</span>
                    <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>OAI-PMH 2.0 · JATS 1.3</span>
                </div>
            </div>
        </footer>
    )
}