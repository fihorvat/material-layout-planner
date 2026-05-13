import { useEffect, useRef, useState } from 'react';
import { parseLength, ParseLengthError } from '@/domain/units';

/**
 * If the user is still holding Shift (e.g. from ortho-locking a line) while
 * typing into the numeric prompt, browsers report the shifted glyph as
 * `e.key` (e.g. `%` for Shift+5). Intercept those keystrokes and insert the
 * bare digit instead so the user doesn't have to release Shift just to type
 * a length.
 */
const handleShiftedDigit = (
  e: React.KeyboardEvent<HTMLInputElement>,
  setValue: (v: string) => void,
): void => {
  if (!e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return;
  const m = /^Digit([0-9])$/.exec(e.code);
  if (!m) return;
  e.preventDefault();
  const digit = m[1]!;
  const input = e.currentTarget;
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? input.value.length;
  const next = input.value.slice(0, start) + digit + input.value.slice(end);
  setValue(next);
  // Restore caret position after React updates the value.
  requestAnimationFrame(() => {
    try {
      input.setSelectionRange(start + 1, start + 1);
    } catch {
      // ignore
    }
  });
};

export type NumericPromptOverlayProps = {
  onSubmit: (lengthMm: number, angleDeg: number) => void;
  onCancel: () => void;
  initialAngleDeg?: number;
  initialLength?: string;
};

const formatAngle = (deg: number): string => {
  const normalized = ((deg % 360) + 360) % 360;
  const rounded = Math.round(normalized * 10) / 10;
  return Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1);
};

export const NumericPromptOverlay = ({
  onSubmit,
  onCancel,
  initialAngleDeg = 0,
  initialLength = '',
}: NumericPromptOverlayProps) => {
  const [length, setLength] = useState(initialLength);
  const [angle, setAngle] = useState(formatAngle(initialAngleDeg));
  const [err, setErr] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    // Place caret at the end so the user can continue typing after the prefilled digit.
    const len = el.value.length;
    try {
      el.setSelectionRange(len, len);
    } catch {
      // Some input types don't support selection ranges; ignore.
    }
  }, []);
  const submit = () => {
    try {
      const lp = parseLength(length);
      if (lp.mm <= 0) {
        setErr('Length must be positive');
        return;
      }
      const aTrim = angle.trim().replace(/[°\u00B0]$/, '');
      const a = aTrim === '' ? 0 : Number(aTrim);
      if (!Number.isFinite(a)) {
        setErr('Invalid angle');
        return;
      }
      onSubmit(lp.mm, a);
    } catch (e) {
      if (e instanceof ParseLengthError) setErr(`Length: ${e.code}`);
      else setErr('Invalid input');
    }
  };
  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        left: 12,
        zIndex: 50,
        background: 'var(--mlp-card)',
        color: 'var(--mlp-text)',
        border: '1px solid var(--mlp-border-strong)',
        padding: 8,
        borderRadius: 6,
        boxShadow: 'var(--mlp-shadow-md)',
        display: 'flex',
        gap: 8,
        alignItems: 'center',
      }}
      role="dialog"
      aria-label="Enter line length and angle"
    >
      <label style={{ color: 'var(--mlp-text)' }}>
        Length{' '}
        <input
          ref={ref}
          value={length}
          onChange={(e) => setLength(e.target.value)}
          onKeyDown={(e) => {
            handleShiftedDigit(e, setLength);
            if (e.defaultPrevented) return;
            if (e.key === 'Enter') submit();
            if (e.key === 'Escape') onCancel();
          }}
          style={{
            width: 80,
            background: 'var(--mlp-bg)',
            color: 'var(--mlp-text)',
            border: '1px solid var(--mlp-border-strong)',
            borderRadius: 4,
            padding: '2px 6px',
          }}
        />
      </label>
      <label style={{ color: 'var(--mlp-text)' }}>
        Angle{' '}
        <input
          value={angle}
          onChange={(e) => setAngle(e.target.value)}
          onKeyDown={(e) => {
            handleShiftedDigit(e, setAngle);
            if (e.defaultPrevented) return;
            if (e.key === 'Enter') submit();
            if (e.key === 'Escape') onCancel();
          }}
          style={{
            width: 60,
            background: 'var(--mlp-bg)',
            color: 'var(--mlp-text)',
            border: '1px solid var(--mlp-border-strong)',
            borderRadius: 4,
            padding: '2px 6px',
          }}
        />
      </label>
      <button type="button" onClick={submit}>OK</button>
      <button type="button" onClick={onCancel}>Cancel</button>
      {err ? <span style={{ color: 'var(--mlp-danger)' }}>{err}</span> : null}
    </div>
  );
};
