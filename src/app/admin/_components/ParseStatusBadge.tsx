const STATUSES: Record<string, { label: string; color: string; bg: string }> = {
    not_indexed: { label: 'Не индексировано', color: '#6a6a6a', bg: '#f3f1ec' },
    pending:     { label: 'В очереди',        color: '#92400e', bg: '#fef3c7' },
    processing:  { label: 'Парсится',         color: '#1e40af', bg: '#dbeafe' },
    done:        { label: 'Проиндексировано', color: '#166534', bg: '#dcfce7' },
    failed:      { label: 'Ошибка',           color: '#991b1b', bg: '#fee2e2' },
};

export default function ParseStatusBadge({ status }: { status: string | null }) {
    const s = STATUSES[status || 'not_indexed'] || STATUSES.not_indexed;
    return (
        <span style={{
            fontSize: 11, fontWeight: 600, padding: '3px 8px',
            borderRadius: 3, color: s.color, background: s.bg,
            whiteSpace: 'nowrap',
        }}>
      {s.label}
    </span>
    );
}