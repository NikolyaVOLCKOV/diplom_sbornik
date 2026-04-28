'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px',
    border: '1px solid var(--border)', borderRadius: 4,
    fontSize: 14, color: 'var(--ink)', background: '#fff',
    outline: 'none', boxSizing: 'border-box',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: 20 }}>
            <label style={{
                display: 'block', fontSize: 12, fontWeight: 600,
                color: 'var(--ink3)', marginBottom: 6,
                textTransform: 'uppercase', letterSpacing: '0.04em',
            }}>
                {label}
            </label>
            {children}
        </div>
    )
}

export default function NewIssuePage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const [form, setForm] = useState({
        volume:     '',
        number:     '',
        year:       String(new Date().getFullYear()),
        title_ru:   '',
        is_current: false,
    })

    function setField(key: string, value: string | boolean) {
        setForm(f => ({ ...f, [key]: value }))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const res = await fetch('/api/admin/issues', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    volume: Number(form.volume),
                    number: Number(form.number),
                    year:   Number(form.year),
                }),
            })

            const data = await res.json()
            if (!res.ok) { setError(data.error || 'Ошибка сохранения'); return }

            router.push('/admin/issues')
        } catch {
            setError('Ошибка соединения с сервером')
        } finally {
            setLoading(false)
        }
    }

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
                                { label: 'Дашборд',  href: '/admin' },
                                { label: 'Выпуски',  href: '/admin/issues' },
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

            <main style={{ maxWidth: 700, margin: '0 auto', padding: '40px 32px' }}>
                <div style={{ marginBottom: 28 }}>
                    <a href="/admin/issues" style={{ fontSize: 13, color: 'var(--ink3)' }}>← Назад к выпускам</a>
                    <h1 style={{
                        fontFamily: 'Playfair Display, serif',
                        fontSize: 26, fontWeight: 700, color: 'var(--ink)',
                        margin: '12px 0 0',
                    }}>
                        Новый выпуск
                    </h1>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{
                        background: '#fff', border: '1px solid var(--border)',
                        borderRadius: 6, padding: '28px 32px',
                    }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                            <Field label="Том *">
                                <input
                                    type="number" min={1} required
                                    value={form.volume}
                                    onChange={e => setField('volume', e.target.value)}
                                    style={inputStyle}
                                />
                            </Field>
                            <Field label="Номер *">
                                <input
                                    type="number" min={1} max={4} required
                                    value={form.number}
                                    onChange={e => setField('number', e.target.value)}
                                    style={inputStyle}
                                />
                            </Field>
                            <Field label="Год *">
                                <input
                                    type="number" min={2000} max={2100} required
                                    value={form.year}
                                    onChange={e => setField('year', e.target.value)}
                                    style={inputStyle}
                                />
                            </Field>
                        </div>

                        <Field label="Название выпуска (рус.)">
                            <input
                                type="text"
                                value={form.title_ru}
                                onChange={e => setField('title_ru', e.target.value)}
                                placeholder="Выпуск 1 (38) 2026"
                                style={inputStyle}
                            />
                        </Field>

                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '14px 16px', background: 'var(--paper2)',
                            borderRadius: 4, marginTop: 4,
                        }}>
                            <input
                                type="checkbox"
                                id="is_current"
                                checked={form.is_current}
                                onChange={e => setField('is_current', e.target.checked)}
                                style={{ width: 16, height: 16, cursor: 'pointer' }}
                            />
                            <label htmlFor="is_current" style={{
                                fontSize: 14, color: 'var(--ink)', cursor: 'pointer',
                            }}>
                                Сделать текущим выпуском
                            </label>
                        </div>

                        {form.is_current && (
                            <div style={{
                                marginTop: 10, padding: '10px 14px',
                                background: '#fef3c7', border: '1px solid #fcd34d',
                                borderRadius: 4, fontSize: 13, color: '#92400e',
                            }}>
                                ⚠️ Предыдущий текущий выпуск будет автоматически переведён в архив
                            </div>
                        )}
                    </div>

                    {error && (
                        <div style={{
                            margin: '16px 0', padding: '12px 16px',
                            background: '#fef2f2', border: '1px solid #fecaca',
                            borderRadius: 4, fontSize: 13, color: '#b91c1c',
                        }}>
                            {error}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                        <a href="/admin/issues" style={{
                            fontSize: 14, color: 'var(--ink3)',
                            border: '1px solid var(--border)', background: '#fff',
                            padding: '10px 24px', borderRadius: 4, textDecoration: 'none',
                        }}>
                            Отмена
                        </a>
                        <button type="submit" disabled={loading} style={{
                            fontSize: 14, fontWeight: 600, color: '#fff',
                            background: loading ? 'var(--ink3)' : 'var(--burgundy)',
                            border: 'none', padding: '10px 28px', borderRadius: 4,
                            cursor: loading ? 'not-allowed' : 'pointer',
                        }}>
                            {loading ? 'Сохранение...' : 'Создать выпуск'}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    )
}