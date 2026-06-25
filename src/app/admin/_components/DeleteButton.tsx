'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteButton({
                                         id,
                                         label,
                                         canDelete,
                                     }: {
    id: string;
    label: string;
    canDelete: boolean;
}) {
    const router = useRouter();
    const [busy, setBusy] = useState(false);

    const handle = async () => {
        if (!canDelete) {
            alert('Нельзя удалить выпуск, в котором есть статьи. Сначала перенесите или удалите статьи.');
            return;
        }
        if (!confirm(`Удалить выпуск ${label}? Это действие необратимо.`)) return;

        setBusy(true);
        try {
            const res = await fetch(`/api/admin/issues/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) {
                alert(data.error || 'Не удалось удалить');
                return;
            }
            router.refresh();
        } finally {
            setBusy(false);
        }
    };

    return (
        <button
            type="button"
            onClick={handle}
            disabled={busy || !canDelete}
            title={canDelete ? 'Удалить выпуск' : 'В выпуске есть статьи — удаление невозможно'}
            style={{
                fontSize: 12,
                color: canDelete ? 'var(--burgundy)' : 'var(--ink3)',
                background: 'transparent',
                padding: '4px 10px',
                border: `1px solid ${canDelete ? 'var(--burgundy)' : 'var(--border)'}`,
                borderRadius: 3,
                cursor: canDelete && !busy ? 'pointer' : 'not-allowed',
                opacity: busy ? 0.5 : 1,
            }}
        >
            {busy ? '…' : 'Удалить'}
        </button>
    );
}