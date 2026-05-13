import { useToastStore } from '@/state/toastStore';

const COLOR_VARS: Record<string, string> = {
  info: 'var(--mlp-info)',
  success: 'var(--mlp-success)',
  warning: 'var(--mlp-warning)',
  error: 'var(--mlp-danger)',
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
            background: 'var(--mlp-card)',
            color: 'var(--mlp-text)',
            border: `1px solid ${COLOR_VARS[t.severity] ?? 'var(--mlp-border-strong)'}`,
            borderLeftWidth: 4,
            borderRadius: 6,
            padding: '8px 12px',
            boxShadow: 'var(--mlp-shadow-md)',
            minWidth: 220,
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span style={{ color: COLOR_VARS[t.severity] ?? 'var(--mlp-text)', fontWeight: 600, fontSize: 12 }}>
            {t.severity.toUpperCase()}
          </span>
          <span style={{ flex: 1, fontSize: 13 }}>{t.message}</span>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--mlp-muted)' }}
            aria-label="Dismiss toast"
          >
            \u00D7
          </button>
        </div>
      ))}
    </div>
  );
};
