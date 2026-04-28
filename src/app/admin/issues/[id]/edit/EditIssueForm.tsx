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

export default function EditIssueForm({ issue }: { issue: any }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError]     = useState('')
    const [success, setSuccess] = useState(false)

    const [form, setForm] = useState({
        volume:     String(issue.volume),
        number:     String(issue.number),
        year:       String(issue.year),
        title_ru:   issue.title_ru || '',
        is_current: issue.is_current || false,
    })

    function setField(key: string, value: string | boolean) {
        setForm(f => ({ ...f, [key]: value }))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setSuccess(false)
        setLoading(true)

        try {
            const res = await fetch(`/api/admin/issues/${issue.id}`, {
                method: 'PATCH',
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

            setSuccess(true)
            setTimeout(() => router.push('/admin/issues'), 1000)
        } catch {
            setError('Ошибка соединения с сервером')
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete() {
        if (!confirm('Удалить выпуск? Это действие нельзя отменить.')) return
        setLoading(true)

        try {
            const res = await fetch(`/api/admin/issues/${issue.id}`, { method: 'DELETE' })
            const data = await res.json()
            if (!res.ok) { setError(data.error || 'Ошибка удаления'); return }
            router.push('/admin/issues')
        } catch {
            setError('Ошибка соединения с сервером')
        } finally {
            setLoading(false)
        }
    }

    return (
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
                        Текущий выпуск
                    </label>
                </div>

                {form.is_current && !issue.is_current && (
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

            {success && (
                <div style={{
                    margin: '16px 0', padding: '12px 16px',
                    background: '#dcfce7', border: '1px solid #86efac',
                    borderRadius: 4, fontSize: 13, color: '#166534',
                }}>
                    Сохранено! Перенаправляем...
                </div>
            )}

            <div style={{
                display: 'flex', gap: 12,
                justifyContent: 'space-between', marginTop: 24,
            }}>
                <button type="button" onClick={handleDelete} disabled={loading} style={{
                    fontSize: 13, color: '#b91c1c',
                    border: '1px solid #fecaca', background: '#fff',
                    padding: '10px 20px', borderRadius: 4,
                    cursor: loading ? 'not-allowed' : 'pointer',
                }}>
                    Удалить выпуск
                </button>

                <div style={{ display: 'flex', gap: 12 }}>
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
                        {loading ? 'Сохранение...' : 'Сохранить'}
                    </button>
                </div>
            </div>
        </form>
    )
}