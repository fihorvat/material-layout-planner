/**
 * Small non-interactive overlay that hints to the user that they can type a
 * number while a drawing tool is active to enter an exact length (in mm by
 * default; cm/m units also accepted, e.g. "279cm").
 *
 * Rendered next to the canvas while a line/polygon/rectangle tool is in its
 * "pick second point" phase and the numeric prompt is not yet open.
 */
export const TypeLengthHint = () => (
  <div
    style={{
      position: 'absolute',
      bottom: 12,
      left: 12,
      zIndex: 40,
      background: 'var(--mlp-card)',
      color: 'var(--mlp-text-muted, var(--mlp-text))',
      border: '1px solid var(--mlp-border-strong)',
      padding: '4px 8px',
      borderRadius: 6,
      boxShadow: 'var(--mlp-shadow-sm, var(--mlp-shadow-md))',
      fontSize: 12,
      pointerEvents: 'none',
      opacity: 0.9,
    }}
    role="note"
    aria-label="Tip: type a number for exact length"
  >
    Tip: type a number (e.g. <code>279cm</code>) then <kbd>Enter</kbd> for exact length
  </div>
);
