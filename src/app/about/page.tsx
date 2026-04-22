import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function AboutPage() {
    return (
        <main style={{ background: 'var(--paper)', minHeight: '100vh' }}>
            <Header />

            <div style={{ background: '#141414', color: '#fff', padding: '48px 0' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
                    <div style={{ fontSize: 11, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>
                        О журнале
                    </div>
                    <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 700 }}>
                        Гуманитарные исследования Центральной России
                    </h1>
                </div>
            </div>

            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 32px', display: 'grid', gridTemplateColumns: '1fr 300px', gap: 48 }}>

                <article style={{ fontFamily: 'Lora, serif', fontSize: 16, lineHeight: 1.8, color: 'var(--ink2)' }}>
                    <p style={{ marginBottom: 20 }}>
                        «Гуманитарные исследования Центральной России» — рецензируемый научный журнал, издаваемый Липецким государственным педагогическим университетом имени П.П. Семенова-Тян-Шанского с 2018 года.
                    </p>
                    <p style={{ marginBottom: 20 }}>
                        Журнал публикует оригинальные научные статьи по историческим, педагогическим и социологическим наукам. Все материалы проходят двойное слепое рецензирование.
                    </p>
                    <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700, color: 'var(--ink)', margin: '32px 0 16px' }}>
                        Учредитель и издатель
                    </h2>
                    <p style={{ marginBottom: 20 }}>
                        Федеральное государственное бюджетное образовательное учреждение высшего образования «Липецкий государственный педагогический университет имени П.П. Семенова-Тян-Шанского».
                    </p>
                    <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700, color: 'var(--ink)', margin: '32px 0 16px' }}>
                        Журнал входит в Перечень ВАК
                    </h2>
                    <p style={{ marginBottom: 12 }}>Журнал включён в Перечень рецензируемых научных изданий ВАК по следующим специальностям:</p>
                    {[
                        '5.6.1. Отечественная история (исторические науки)',
                        '5.6.2. Всеобщая история (исторические науки)',
                        '5.8.1. Общая педагогика, история педагогики и образования (педагогические науки)',
                        '5.8.7. Методология и технология профессионального образования (педагогические науки)',
                    ].map(s => (
                        <div key={s} style={{ display: 'flex', gap: 10, marginBottom: 8, fontSize: 15 }}>
                            <span style={{ color: 'var(--burgundy)', flexShrink: 0 }}>›</span>
                            <span>{s}</span>
                        </div>
                    ))}

                    <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700, color: 'var(--ink)', margin: '32px 0 16px' }}>
                        Индексирование
                    </h2>
                    <p>Журнал индексируется в РИНЦ (eLibrary.ru), КиберЛенинке, Google Scholar, Ulrich's Periodicals Directory. Всем статьям присваивается DOI. Журнал зарегистрирован в Российской государственной библиотеке.</p>

                    <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700, color: 'var(--ink)', margin: '32px 0 16px' }}>
                        Периодичность
                    </h2>
                    <p>4 выпуска в год (ежеквартально).</p>

                    <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700, color: 'var(--ink)', margin: '32px 0 16px' }}>
                        Контакты редакции
                    </h2>
                    <p>Ответственный секретарь редакции:<br />
                        <a href="mailto:humresearch@lspu.lipetsk.ru" style={{ color: 'var(--burgundy)' }}>
                            humresearch@lspu.lipetsk.ru
                        </a>
                    </p>
                </article>

                {/* Сайдбар */}
                <aside style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 4, padding: 20 }}>
                        <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 14, fontWeight: 700, marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                            Реквизиты журнала
                        </h3>
                        {[
                            { label: 'ISSN (online)', value: '2541-9056' },
                            { label: 'DOI', value: '10.24412/2541-9056' },
                            { label: 'Основан', value: '2018' },
                            { label: 'Язык', value: 'Русский / English' },
                            { label: 'Периодичность', value: '4 раза в год' },
                        ].map(({ label, value }) => (
                            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                                <span style={{ color: 'var(--ink3)' }}>{label}</span>
                                <span style={{ color: 'var(--ink)', fontWeight: 500, fontFamily: label === 'ISSN (online)' || label === 'DOI' ? 'monospace' : 'inherit' }}>{value}</span>
                            </div>
                        ))}
                    </div>

                    {/* Индексаторы */}
                    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 4, padding: 20 }}>
                        <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 14, fontWeight: 700, marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                            Индексируется в
                        </h3>
                        {['ВАК', 'РИНЦ', 'eLibrary', 'КиберЛенинка', 'Google Scholar', 'Ulrich\'s', 'DOI / CrossRef', 'РГБ'].map(name => (
                            <div key={name} style={{ fontSize: 13, padding: '5px 0', borderBottom: '1px solid var(--border)', color: 'var(--ink2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ color: 'var(--burgundy)' }}>✓</span> {name}
                            </div>
                        ))}
                    </div>

                    <a href="/editorial-policy" style={{ display: 'block', background: 'var(--paper2)', border: '1px solid var(--border)', borderRadius: 4, padding: 16, fontSize: 13, color: 'var(--ink2)', textAlign: 'center' }}>
                        Редакционная политика →
                    </a>
                    <a href="/ethics" style={{ display: 'block', background: 'var(--paper2)', border: '1px solid var(--border)', borderRadius: 4, padding: 16, fontSize: 13, color: 'var(--ink2)', textAlign: 'center' }}>
                        Этика публикаций →
                    </a>
                </aside>
            </div>

            <Footer />
        </main>
    )
}