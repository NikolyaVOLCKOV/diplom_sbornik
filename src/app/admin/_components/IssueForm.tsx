'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export type IssueInitialValues = {
    volume?: number;
    number?: number;
    year?: number;
    title_ru?: string | null;
    title_en?: string | null;
    published_at?: string | null;
    cover_url?: string | null;
    is_current?: boolean;
};

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

export default function IssueForm({
                                      initialValues,
                                      issueId,
                                  }: {
    initialValues?: IssueInitialValues;
    issueId?: string;
}) {
    const router = useRouter();
    const isEdit = !!issueId;
    const iv = initialValues ?? {};

    const currentYear = new Date().getFullYear();

    const [volume, setVolume] = useState(iv.volume?.toString() ?? '');
    const [number, setNumber] = useState(iv.number?.toString() ?? '');
    const [year, setYear] = useState(iv.year?.toString() ?? currentYear.toString());
    const [titleRu, setTitleRu] = useState(iv.title_ru ?? '');
    const [titleEn, setTitleEn] = useState(iv.title_en ?? '');
    const [publishedAt, setPublishedAt] = useState(
        iv.published_at ? new Date(iv.published_at).toISOString().slice(0, 10) : ''
    );
    const [coverUrl, setCoverUrl] = useState(iv.cover_url ?? '');
    const [isCurrent, setIsCurrent] = useState(iv.is_current ?? false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!volume || !number || !year) {
            setError('Заполни том, номер и год');
            return;
        }

        setBusy(true);
        try {
            const payload = {
                volume: Number(volume),
                number: Number(number),
                year: Number(year),
                title_ru: titleRu || undefined,
                title_en: titleEn || undefined,
                published_at: publishedAt || undefined,
                cover_url: coverUrl || undefined,
                is_current: isCurrent,
            };

            const url = isEdit ? `/api/admin/issues/${issueId}` : '/api/admin/issues';
            const method = isEdit ? 'PATCH' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Не удалось сохранить');

            router.push('/admin/issues');
            router.refresh();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Неизвестная ошибка');
        } finally {
            setBusy(false);
        }
    };

    return (
        <form onSubmit={submit}>
            <div style={fieldsetStyle}>
                <div style={legendStyle}>Основное</div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div>
                        <label style={labelStyle}>Том *</label>
                        <input style={inputStyle} type="number" min="1" value={volume} onChange={e => setVolume(e.target.value)} required />
                    </div>
                    <div>
                        <label style={labelStyle}>Номер *</label>
                        <input style={inputStyle} type="number" min="1" value={number} onChange={e => setNumber(e.target.value)} required />
                    </div>
                    <div>
                        <label style={labelStyle}>Год *</label>
                        <input style={inputStyle} type="number" min="1900" max="2100" value={year} onChange={e => setYear(e.target.value)} required />
                    </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>Название выпуска (рус)</label>
                    <input style={inputStyle} value={titleRu} onChange={e => setTitleRu(e.target.value)} placeholder="Тематический выпуск, если есть" />
                </div>

                <div>
                    <label style={labelStyle}>Title (en)</label>
                    <input style={inputStyle} value={titleEn} onChange={e => setTitleEn(e.target.value)} />
                </div>
            </div>

            <div style={fieldsetStyle}>
                <div style={legendStyle}>Публикация</div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginBottom: 16 }}>
                    <div>
                        <label style={labelStyle}>Дата публикации</label>
                        <input style={inputStyle} type="date" value={publishedAt} onChange={e => setPublishedAt(e.target.value)} />
                    </div>
                    <div>
                        <label style={labelStyle}>URL обложки</label>
                        <input style={inputStyle} value={coverUrl} onChange={e => setCoverUrl(e.target.value)} placeholder="https://..." />
                    </div>
                </div>

                <label
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: 12,
                        background: isCurrent ? 'var(--paper2)' : '#fff',
                        border: `1px solid ${isCurrent ? 'var(--burgundy)' : 'var(--border)'}`,
                        borderRadius: 4,
                        cursor: 'pointer',
                    }}
                >
                    <input
                        type="checkbox"
                        checked={isCurrent}
                        onChange={e => setIsCurrent(e.target.checked)}
                        style={{ width: 18, height: 18, cursor: 'pointer' }}
                    />
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>
                            Сделать текущим выпуском
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 2 }}>
                            Этот выпуск появится на главной. С предыдущего текущего флаг снимется автоматически.
                        </div>
                    </div>
                </label>
            </div>

            {error && (
                <div style={{ color: 'var(--burgundy-dark)', background: '#fbeaea', border: '1px solid var(--burgundy)', padding: '12px 16px', borderRadius: 4, marginBottom: 16, fontSize: 14 }}>
                    {error}
                </div>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                    type="button"
                    onClick={() => router.push('/admin/issues')}
                    style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--ink2)', padding: '10px 20px', borderRadius: 4, cursor: 'pointer', fontSize: 14 }}
                >
                    Отмена
                </button>
                <button
                    type="submit"
                    disabled={busy}
                    style={{ background: 'var(--burgundy)', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 4, fontSize: 14, fontWeight: 500, cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.6 : 1 }}
                >
                    {busy ? 'Сохранение…' : isEdit ? 'Сохранить изменения' : 'Создать выпуск'}
                </button>
            </div>
        </form>
    );
}