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
            border: `1px solid var(--mlp-border)`,
            borderLeft: `3px solid ${COLOR_VARS[t.severity] ?? 'var(--mlp-border-strong)'}`,
            borderRadius: 'var(--mlp-radius-md)',
            padding: '10px 14px',
            boxShadow: 'var(--mlp-shadow-lg)',
            minWidth: 260,
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span
            style={{
              color: COLOR_VARS[t.severity] ?? 'var(--mlp-text)',
              fontWeight: 700,
              fontSize: 10,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            {t.severity}
          </span>
          <span style={{ flex: 1, fontSize: 13, lineHeight: 1.4 }}>{t.message}</span>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--mlp-muted)',
              fontSize: 18,
              lineHeight: 1,
              padding: '0 4px',
              borderRadius: 'var(--mlp-radius-sm)',
            }}
            aria-label="Dismiss toast"
          >
            {'\u00D7'}
          </button>
        </div>
      ))}
    </div>
  );
};
