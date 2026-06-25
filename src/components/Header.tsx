'use client'
import { useState } from 'react'

export default function Header() {
    const [journalOpen, setJournalOpen] = useState(false)

    return (
        <header style={{ background: '#fff', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100 }}>
            <div className="site-header-inner container" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', display: 'flex', alignItems: 'center', height: 64, gap: 32 }}>
                <a href="/" style={{ fontFamily: 'Playfair Display, serif', fontSize: 14, fontWeight: 700, lineHeight: 1.25, maxWidth: 280, color: 'var(--ink)' }}>
                    Гуманитарные исследования Центральной России
                </a>

                <nav className="site-nav" style={{ display: 'flex', gap: 2, flex: 1, position: 'relative' }}>

                    {/* О журнале — с выпадающим меню */}
                    <div
                        style={{ position: 'relative' }}
                        onMouseEnter={() => setJournalOpen(true)}
                        onMouseLeave={() => setJournalOpen(false)}
                    >
                        <a href="/about" style={{ fontSize: 13, color: 'var(--ink3)', padding: '8px 12px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                            О журнале
                            <span style={{ fontSize: 9, color: 'var(--ink3)', marginTop: 1 }}>▾</span>
                        </a>

                        {journalOpen && (
                            <div style={{
                                position: 'absolute', top: '100%', left: 0,
                                background: '#fff', border: '1px solid var(--border)',
                                borderRadius: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                                minWidth: 220, zIndex: 200, paddingTop: 4, paddingBottom: 4,
                            }}>
                                {[
                                    { label: 'О журнале',              href: '/about' },
                                    { label: 'Редакционная политика',  href: '/editorial-policy' },
                                    { label: 'Этика публикаций',       href: '/ethics' },
                                    { label: 'Главный редактор',       href: '/about#editor' },
                                ].map(({ label, href }) => (
                                    <a key={label} href={href} style={{
                                        display: 'block', padding: '9px 16px',
                                        fontSize: 13, color: 'var(--ink2)',
                                        borderBottom: '1px solid var(--border)',
                                        transition: 'background .1s',
                                    }}
                                       onMouseEnter={e => (e.currentTarget.style.background = 'var(--paper2)')}
                                       onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                    >
                                        {label}
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Остальные пункты */}
                    <a href="/current" style={{ fontSize: 13, color: 'var(--ink3)', padding: '8px 12px', borderRadius: 4 }}>Текущий выпуск</a>
                    <a href="/archive"  style={{ fontSize: 13, color: 'var(--ink3)', padding: '8px 12px', borderRadius: 4 }}>Архив</a>
                    <a href="/rules"    style={{ fontSize: 13, color: 'var(--ink3)', padding: '8px 12px', borderRadius: 4 }}>Правила</a>
                    <a href="/search"   style={{ fontSize: 13, color: 'var(--ink3)', padding: '8px 12px', borderRadius: 4 }}>Поиск</a>
                </nav>

                <a href="/rules#submit" style={{ background: 'var(--burgundy)', color: '#fff', borderRadius: 4, padding: '7px 16px', fontSize: 13, fontWeight: 500, flexShrink: 0 }}>
                    Подать статью
                </a>
            </div>
        </header>
    )
}