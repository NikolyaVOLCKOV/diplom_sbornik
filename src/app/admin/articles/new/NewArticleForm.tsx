'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Issue   = { id: string; volume: number; number: number; year: number; title_ru: string }
type Section = { id: string; name_ru: string; slug: string; vak_code: string }

type Author = {
    last_name_ru: string
    first_name_ru: string
    middle_name_ru: string
    orcid: string
}

const emptyAuthor = (): Author => ({
    last_name_ru: '', first_name_ru: '', middle_name_ru: '', orcid: '',
})

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: 20 }}>
            <label style={{
                display: 'block', fontSize: 12, fontWeight: 600,
                color: 'var(--ink3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em',
            }}>
                {label}
            </label>
            {children}
        </div>
    )
}

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px',
    border: '1px solid var(--border)', borderRadius: 4,
    fontSize: 14, color: 'var(--ink)', background: '#fff',
    outline: 'none', boxSizing: 'border-box',
}

const textareaStyle: React.CSSProperties = {
    ...inputStyle, resize: 'vertical', minHeight: 100,
}

export default function NewArticleForm({ issues, sections }: { issues: Issue[]; sections: Section[] }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError]     = useState('')

    const [form, setForm] = useState({
        issue_id:    '',
        section_id:  '',
        title_ru:    '',
        title_en:    '',
        abstract_ru: '',
        abstract_en: '',
        doi:         '',
        pages_from:  '',
        pages_to:    '',
        keywords_ru: '',
        status:      'draft',
    })

    const [authors, setAuthors] = useState<Author[]>([emptyAuthor()])

    function setField(key: string, value: string) {
        setForm(f => ({ ...f, [key]: value }))
    }

    function setAuthor(index: number, key: keyof Author, value: string) {
        setAuthors(prev => prev.map((a, i) => i === index ? { ...a, [key]: value } : a))
    }

    function addAuthor() { setAuthors(prev => [...prev, emptyAuthor()]) }

    function removeAuthor(index: number) {
        setAuthors(prev => prev.filter((_, i) => i !== index))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const res = await fetch('/api/admin/articles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, authors }),
            })

            const data = await res.json()
            if (!res.ok) { setError(data.error || 'Ошибка сохранения'); return }

            router.push('/admin')
        } catch {
            setError('Ошибка соединения с сервером')
        } finally {
            setLoading(false)
        }
    }

    const card: React.CSSProperties = {
        background: '#fff', border: '1px solid var(--border)',
        borderRadius: 6, padding: '28px 32px', marginBottom: 24,
    }

    return (
        <form onSubmit={handleSubmit}>

            {/* Принадлежность */}
            <div style={card}>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', margin: '0 0 20px' }}>
                    Выпуск и раздел
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <Field label="Выпуск *">
                        <select value={form.issue_id} onChange={e => setField('issue_id', e.target.value)}
                                required style={inputStyle}>
                            <option value="">— Выберите выпуск —</option>
                            {issues.map(i => (
                                <option key={i.id} value={i.id}>
                                    Том {i.volume}, № {i.number} ({i.year}){i.title_ru ? ` — ${i.title_ru}` : ''}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Раздел *">
                        <select value={form.section_id} onChange={e => setField('section_id', e.target.value)}
                                required style={inputStyle}>
                            <option value="">— Выберите раздел —</option>
                            {sections.map(s => (
                                <option key={s.id} value={s.id}>{s.name_ru}</option>
                            ))}
                        </select>
                    </Field>
                </div>
            </div>

            {/* Метаданные */}
            <div style={card}>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', margin: '0 0 20px' }}>
                    Метаданные статьи
                </h2>

                <Field label="Название (рус.) *">
          <textarea value={form.title_ru} onChange={e => setField('title_ru', e.target.value)}
                    required style={{ ...textareaStyle, minHeight: 72 }} />
                </Field>

                <Field label="Название (англ.)">
          <textarea value={form.title_en} onChange={e => setField('title_en', e.target.value)}
                    style={{ ...textareaStyle, minHeight: 72 }} />
                </Field>

                <Field label="Аннотация (рус.)">
          <textarea value={form.abstract_ru} onChange={e => setField('abstract_ru', e.target.value)}
                    style={textareaStyle} />
                </Field>

                <Field label="Аннотация (англ.)">
          <textarea value={form.abstract_en} onChange={e => setField('abstract_en', e.target.value)}
                    style={textareaStyle} />
                </Field>

                <Field label="Ключевые слова (через запятую)">
                    <input type="text" value={form.keywords_ru}
                           onChange={e => setField('keywords_ru', e.target.value)}
                           placeholder="история, педагогика, Россия" style={inputStyle} />
                </Field>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 16 }}>
                    <Field label="DOI">
                        <input type="text" value={form.doi}
                               onChange={e => setField('doi', e.target.value)}
                               placeholder="10.24888/2500-9856-2025-37-1-1-15" style={inputStyle} />
                    </Field>
                    <Field label="Страница с">
                        <input type="number" value={form.pages_from}
                               onChange={e => setField('pages_from', e.target.value)}
                               style={inputStyle} />
                    </Field>
                    <Field label="Страница по">
                        <input type="number" value={form.pages_to}
                               onChange={e => setField('pages_to', e.target.value)}
                               style={inputStyle} />
                    </Field>
                </div>

                <Field label="Статус">
                    <select value={form.status} onChange={e => setField('status', e.target.value)}
                            style={inputStyle}>
                        <option value="draft">Черновик</option>
                        <option value="review">На рецензии</option>
                        <option value="published">Опубликована</option>
                        <option value="retracted">Отозвана</option>
                    </select>
                </Field>
            </div>

            {/* Авторы */}
            <div style={card}>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', margin: '0 0 20px' }}>
                    Авторы
                </h2>

                {authors.map((author, i) => (
                    <div key={i} style={{
                        border: '1px solid var(--border)', borderRadius: 6,
                        padding: '20px', marginBottom: 16, position: 'relative',
                    }}>
                        <div style={{
                            fontSize: 12, fontWeight: 600, color: 'var(--ink3)',
                            marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.04em',
                        }}>
                            Автор {i + 1}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                            <Field label="Фамилия *">
                                <input type="text" value={author.last_name_ru}
                                       onChange={e => setAuthor(i, 'last_name_ru', e.target.value)}
                                       required style={inputStyle} />
                            </Field>
                            <Field label="Имя *">
                                <input type="text" value={author.first_name_ru}
                                       onChange={e => setAuthor(i, 'first_name_ru', e.target.value)}
                                       required style={inputStyle} />
                            </Field>
                            <Field label="Отчество">
                                <input type="text" value={author.middle_name_ru}
                                       onChange={e => setAuthor(i, 'middle_name_ru', e.target.value)}
                                       style={inputStyle} />
                            </Field>
                        </div>

                        <Field label="ORCID">
                            <input type="text" value={author.orcid}
                                   onChange={e => setAuthor(i, 'orcid', e.target.value)}
                                   placeholder="0000-0000-0000-0000" style={inputStyle} />
                        </Field>

                        {authors.length > 1 && (
                            <button type="button" onClick={() => removeAuthor(i)} style={{
                                position: 'absolute', top: 16, right: 16,
                                fontSize: 12, color: '#b91c1c', background: 'none',
                                border: 'none', cursor: 'pointer', padding: '2px 8px',
                            }}>
                                Удалить
                            </button>
                        )}
                    </div>
                ))}

                <button type="button" onClick={addAuthor} style={{
                    fontSize: 13, color: 'var(--burgundy)',
                    border: '1px solid var(--burgundy)', background: 'none',
                    padding: '8px 16px', borderRadius: 4, cursor: 'pointer',
                }}>
                    + Добавить автора
                </button>
            </div>

            {/* Ошибка и кнопки */}
            {error && (
                <div style={{
                    marginBottom: 16, padding: '12px 16px',
                    background: '#fef2f2', border: '1px solid #fecaca',
                    borderRadius: 4, fontSize: 13, color: '#b91c1c',
                }}>
                    {error}
                </div>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <a href="/admin" style={{
                    fontSize: 14, color: 'var(--ink3)',
                    border: '1px solid var(--border)', background: '#fff',
                    padding: '10px 24px', borderRadius: 4,
                }}>
                    Отмена
                </a>
                <button type="submit" disabled={loading} style={{
                    fontSize: 14, fontWeight: 600, color: '#fff',
                    background: loading ? 'var(--ink3)' : 'var(--burgundy)',
                    border: 'none', padding: '10px 28px', borderRadius: 4,
                    cursor: loading ? 'not-allowed' : 'pointer',
                }}>
                    {loading ? 'Сохранение...' : 'Сохранить статью'}
                </button>
            </div>
        </form>
    )
}