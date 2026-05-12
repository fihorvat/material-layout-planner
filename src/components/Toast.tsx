import { useToastStore } from '@/state/toastStore';

const COLORS: Record<string, string> = {
  info: '#2563eb',
  success: '#059669',
  warning: '#d97706',
  error: '#dc2626',
};

export const ToastContainer = () => {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismissToast);
  if (toasts.length === 0) return null;
  return (
    <div
      style={{
        position: 'fixed',
        top: 12,
        right: 12,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          style={{
            background: '#ffffff',
            border: `1px solid ${COLORS[t.severity] ?? '#cbd5e1'}`,
            borderLeftWidth: 4,
            borderRadius: 6,
            padding: '8px 12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            minWidth: 220,
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span style={{ color: COLORS[t.severity] ?? '#111', fontWeight: 600, fontSize: 12 }}>
            {t.severity.toUpperCase()}
          </span>
          <span style={{ flex: 1, fontSize: 13 }}>{t.message}</span>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b7280' }}
            aria-label="Dismiss toast"
          >
            \u00D7
          </button>
        </div>
      ))}
    </div>
  );
};
