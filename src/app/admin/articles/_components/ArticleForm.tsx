'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Issue = {
    id: string;
    volume: number;
    number: number;
    year: number;
    title_ru: string | null;
};

type Section = {
    id: string;
    name_ru: string;
    slug: string;
    vak_code: string | null;
};

type Author = {
    last_name_ru: string;
    first_name_ru: string;
    middle_name_ru: string;
    orcid: string;
    affiliation: string;
};

type Status = 'draft' | 'review' | 'published' | 'retracted';

export type ArticleInitialValues = {
    title_ru?: string;
    title_en?: string | null;
    abstract_ru?: string;
    abstract_en?: string | null;
    doi?: string | null;
    issue_id?: string;
    section_id?: string;
    pages_from?: number | null;
    pages_to?: number | null;
    status?: Status;
    keywords?: string[];
    authors?: Author[];
    pdf_path?: string | null;
};


const emptyAuthor: Author = {
    last_name_ru: '',
    first_name_ru: '',
    middle_name_ru: '',
    orcid: '',
    affiliation: '',
};

const STATUSES: { value: Status; label: string }[] = [
    { value: 'draft', label: 'Черновик' },
    { value: 'review', label: 'На рецензии' },
    { value: 'published', label: 'Опубликовано' },
    { value: 'retracted', label: 'Отозвано' },
];

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid var(--border)',
    borderRadius: 4,
    fontFamily: 'inherit',
    fontSize: 14,
    background: '#fff',
    color: 'var(--ink)',
    boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: 6,
    color: 'var(--ink2)',
    fontSize: 12,
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
};

const fieldsetStyle: React.CSSProperties = {
    background: '#fff',
    border: '1px solid var(--border)',
    borderRadius: 6,
    padding: 24,
    marginBottom: 20,
};

const legendStyle: React.CSSProperties = {
    fontFamily: 'Playfair Display, serif',
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--ink)',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: '1px solid var(--border)',
};

export default function ArticleForm({
                                        issues,
                                        sections,
                                        initialValues,
                                        articleId,
                                    }: {
    issues: Issue[];
    sections: Section[];
    initialValues?: ArticleInitialValues;
    articleId?: string;
}) {
    const isEdit = !!articleId;
    const iv = initialValues ?? {};
    const router = useRouter();

    const [titleRu, setTitleRu] = useState(iv.title_ru ?? '');
    const [titleEn, setTitleEn] = useState(iv.title_en ?? '');
    const [abstractRu, setAbstractRu] = useState(iv.abstract_ru ?? '');
    const [abstractEn, setAbstractEn] = useState(iv.abstract_en ?? '');
    const [doi, setDoi] = useState(iv.doi ?? '');
    const [issueId, setIssueId] = useState(iv.issue_id ?? '');
    const [sectionId, setSectionId] = useState(iv.section_id ?? '');
    const [pagesFrom, setPagesFrom] = useState(iv.pages_from?.toString() ?? '');
    const [pagesTo, setPagesTo] = useState(iv.pages_to?.toString() ?? '');
    const [status, setStatus] = useState<Status>(iv.status ?? 'draft');
    const [keywords, setKeywords] = useState((iv.keywords ?? []).join(', '));
    const [authors, setAuthors] = useState<Author[]>(
        iv.authors && iv.authors.length ? iv.authors : [{ ...emptyAuthor }]
    );
    const [pdf, setPdf] = useState<File | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateAuthor = (i: number, field: keyof Author, value: string) =>
        setAuthors(prev => prev.map((a, idx) => (idx === i ? { ...a, [field]: value } : a)));

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!issueId || !sectionId) {
            setError('Выберите выпуск и раздел');
            return;
        }
        if (authors.some(a => !a.last_name_ru.trim() || !a.first_name_ru.trim())) {
            setError('У каждого автора нужны фамилия и имя');
            return;
        }

        setBusy(true);
        try {
            const payload = {
                title_ru: titleRu,
                title_en: titleEn || undefined,
                abstract_ru: abstractRu,
                abstract_en: abstractEn || undefined,
                doi: doi || undefined,
                issue_id: issueId,
                section_id: sectionId,
                pages_from: pagesFrom ? Number(pagesFrom) : undefined,
                pages_to: pagesTo ? Number(pagesTo) : undefined,
                status,
                authors,
                keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
            };

            const fd = new FormData();
            fd.append('payload', JSON.stringify(payload));
            if (pdf) fd.append('pdf', pdf);

            const url = isEdit ? `/api/admin/articles/${articleId}` : '/api/admin/articles';
            const method = isEdit ? 'PATCH' : 'POST';
            const res = await fetch(url, { method, body: fd });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Не удалось сохранить');

            router.push('/admin');
            router.refresh();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Неизвестная ошибка');
        } finally {
            setBusy(false);
        }
    };

    return (
        <form onSubmit={submit}>
            {/* Основное */}
            <fieldset style={{ ...fieldsetStyle, border: 'none', padding: 0 }}>
                <div style={legendStyle}>Основное</div>

                <div style={{ ...fieldsetStyle }}>
                    <div style={{ marginBottom: 16 }}>
                        <label style={labelStyle}>Заголовок (рус) *</label>
                        <input style={inputStyle} value={titleRu} onChange={e => setTitleRu(e.target.value)} required />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label style={labelStyle}>Title (en)</label>
                        <input style={inputStyle} value={titleEn} onChange={e => setTitleEn(e.target.value)} />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label style={labelStyle}>Аннотация (рус) *</label>
                        <textarea
                            style={{ ...inputStyle, minHeight: 140, resize: 'vertical', fontFamily: 'Lora, serif' }}
                            value={abstractRu}
                            onChange={e => setAbstractRu(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>Abstract (en)</label>
                        <textarea
                            style={{ ...inputStyle, minHeight: 100, resize: 'vertical', fontFamily: 'Lora, serif' }}
                            value={abstractEn}
                            onChange={e => setAbstractEn(e.target.value)}
                        />
                    </div>
                </div>
            </fieldset>

            {/* Метаданные */}
            <div style={fieldsetStyle}>
                <div style={legendStyle}>Метаданные</div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr', gap: 16, marginBottom: 16 }}>
                    <div>
                        <label style={labelStyle}>Выпуск *</label>
                        <select style={inputStyle} value={issueId} onChange={e => setIssueId(e.target.value)} required>
                            <option value="">— выберите —</option>
                            {issues.map(i => (
                                <option key={i.id} value={i.id}>
                                    Т. {i.volume}, № {i.number} ({i.year})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>Раздел *</label>
                        <select style={inputStyle} value={sectionId} onChange={e => setSectionId(e.target.value)} required>
                            <option value="">— выберите —</option>
                            {sections.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.name_ru}{s.vak_code ? ` (${s.vak_code})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 16 }}>
                    <div>
                        <label style={labelStyle}>DOI</label>
                        <input style={inputStyle} value={doi} onChange={e => setDoi(e.target.value)} placeholder="10.xxxx/..." />
                    </div>
                    <div>
                        <label style={labelStyle}>Стр. с</label>
                        <input style={inputStyle} type="number" min="1" value={pagesFrom} onChange={e => setPagesFrom(e.target.value)} />
                    </div>
                    <div>
                        <label style={labelStyle}>Стр. по</label>
                        <input style={inputStyle} type="number" min="1" value={pagesTo} onChange={e => setPagesTo(e.target.value)} />
                    </div>
                    <div>
                        <label style={labelStyle}>Статус</label>
                        <select style={inputStyle} value={status} onChange={e => setStatus(e.target.value as Status)}>
                            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                    </div>
                </div>

                <div style={{ marginTop: 16 }}>
                    <label style={labelStyle}>Ключевые слова (через запятую)</label>
                    <input
                        style={inputStyle}
                        value={keywords}
                        onChange={e => setKeywords(e.target.value)}
                        placeholder="история, культура, регион"
                    />
                </div>
            </div>

            {/* Авторы */}
            <div style={fieldsetStyle}>
                <div style={legendStyle}>Авторы</div>

                {authors.map((a, i) => (
                    <div
                        key={i}
                        style={{
                            border: '1px solid var(--border)',
                            borderRadius: 4,
                            padding: 16,
                            marginBottom: 12,
                            background: 'var(--paper2)',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <strong style={{ color: 'var(--burgundy)', fontSize: 13 }}>
                                Автор {i + 1}
                                {i === 0 && (
                                    <span style={{ marginLeft: 8, fontWeight: 'normal', color: 'var(--ink3)', fontSize: 12 }}>
                    (корреспондирующий)
                  </span>
                                )}
                            </strong>
                            {authors.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => setAuthors(prev => prev.filter((_, idx) => idx !== i))}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'var(--burgundy)',
                                        cursor: 'pointer',
                                        fontSize: 13,
                                    }}
                                >
                                    Удалить
                                </button>
                            )}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                            <input style={inputStyle} placeholder="Фамилия *" value={a.last_name_ru} onChange={e => updateAuthor(i, 'last_name_ru', e.target.value)} required />
                            <input style={inputStyle} placeholder="Имя *" value={a.first_name_ru} onChange={e => updateAuthor(i, 'first_name_ru', e.target.value)} required />
                            <input style={inputStyle} placeholder="Отчество" value={a.middle_name_ru} onChange={e => updateAuthor(i, 'middle_name_ru', e.target.value)} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
                            <input style={inputStyle} placeholder="ORCID" value={a.orcid} onChange={e => updateAuthor(i, 'orcid', e.target.value)} />
                            <input style={inputStyle} placeholder="Аффилиация" value={a.affiliation} onChange={e => updateAuthor(i, 'affiliation', e.target.value)} />
                        </div>
                    </div>
                ))}

                <button
                    type="button"
                    onClick={() => setAuthors(prev => [...prev, { ...emptyAuthor }])}
                    style={{
                        background: 'transparent',
                        border: '1px dashed var(--burgundy)',
                        color: 'var(--burgundy)',
                        padding: '8px 16px',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: 13,
                    }}
                >
                    + Добавить автора
                </button>
            </div>

            {/* PDF */}
            <div style={fieldsetStyle}>
                <div style={legendStyle}>PDF</div>
                {isEdit && iv.pdf_path && !pdf && (
                    <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--ink2)' }}>
                        Текущий файл:{' '}

                     <a   href={`/${iv.pdf_path}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: 'var(--burgundy)' }}
                        >
                        {iv.pdf_path.split('/').pop()}
                    </a>
                    <div style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 4 }}>
                Загрузите новый, чтобы заменить
            </div>
        </div>
)}
    <input
        type="file"
        accept="application/pdf"
        onChange={e => setPdf(e.target.files?.[0] || null)}
        style={{ fontSize: 13, color: 'var(--ink2)' }}
    />
{pdf && (
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--ink3)' }}>
            {pdf.name} · {(pdf.size / 1024 / 1024).toFixed(2)} МБ
        </div>
    )}
</div>

            {error && (
                <div
                    style={{
                        color: 'var(--burgundy-dark)',
                        background: '#fbeaea',
                        border: '1px solid var(--burgundy)',
                        padding: '12px 16px',
                        borderRadius: 4,
                        marginBottom: 16,
                        fontSize: 14,
                    }}
                >
                    {error}
                </div>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                    type="button"
                    onClick={() => router.push('/admin')}
                    style={{
                        background: 'transparent',
                        border: '1px solid var(--border)',
                        color: 'var(--ink2)',
                        padding: '10px 20px',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: 14,
                    }}
                >
                    Отмена
                </button>
                <button
                    type="submit"
                    disabled={busy}
                    style={{
                        background: 'var(--burgundy)',
                        color: '#fff',
                        border: 'none',
                        padding: '10px 24px',
                        borderRadius: 4,
                        fontSize: 14,
                        fontWeight: 500,
                        cursor: busy ? 'wait' : 'pointer',
                        opacity: busy ? 0.6 : 1,
                    }}
                >
                    {busy ? 'Сохранение…' : isEdit ? 'Сохранить изменения' : 'Сохранить'}
                </button>
            </div>
        </form>
    );
}