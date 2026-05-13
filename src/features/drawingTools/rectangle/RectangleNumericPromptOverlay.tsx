import { useEffect, useRef, useState } from 'react';
import { parseLength, ParseLengthError } from '@/domain/units';

/**
 * Numeric prompt used by the Rectangle tool. Unlike the Line / Polygon
 * prompt (length + angle), a rectangle takes two lengths (width + height),
 * both of which accept unit suffixes (mm, cm, m).
 */
type RectangleNumericPromptOverlayProps = {
  onSubmit: (widthMm: number, heightMm: number) => void;
  onCancel: () => void;
  initialLength?: string;
};

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
  requestAnimationFrame(() => {
    try {
      input.setSelectionRange(start + 1, start + 1);
    } catch {
      // ignore
    }
  });
};

export const RectangleNumericPromptOverlay = ({
  onSubmit,
  onCancel,
  initialLength = '',
}: RectangleNumericPromptOverlayProps) => {
  const [width, setWidth] = useState(initialLength);
  const [height, setHeight] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const widthRef = useRef<HTMLInputElement | null>(null);
  const heightRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const el = widthRef.current;
    if (!el) return;
    el.focus();
    const len = el.value.length;
    try {
      el.setSelectionRange(len, len);
    } catch {
      // ignore
    }
  }, []);

  const submit = () => {
    try {
      const w = parseLength(width);
      if (w.mm <= 0) {
        setErr('Width must be positive');
        widthRef.current?.focus();
        return;
      }
      const h = parseLength(height);
      if (h.mm <= 0) {
        setErr('Height must be positive');
        heightRef.current?.focus();
        return;
      }
      onSubmit(w.mm, h.mm);
    } catch (e) {
      if (e instanceof ParseLengthError) setErr(`Invalid value: ${e.code}`);
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
      aria-label="Enter rectangle width and height"
    >
      <label style={{ color: 'var(--mlp-text)' }}>
        Width{' '}
        <input
          ref={widthRef}
          value={width}
          onChange={(e) => setWidth(e.target.value)}
          onKeyDown={(e) => {
            handleShiftedDigit(e, setWidth);
            if (e.defaultPrevented) return;
            if (e.key === 'Enter') {
              // Advance to height if it's still empty, otherwise submit.
              if (height.trim() === '') {
                heightRef.current?.focus();
                return;
              }
              submit();
            }
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
        Height{' '}
        <input
          ref={heightRef}
          value={height}
          onChange={(e) => setHeight(e.target.value)}
          onKeyDown={(e) => {
            handleShiftedDigit(e, setHeight);
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
      <button type="button" onClick={submit}>OK</button>
      <button type="button" onClick={onCancel}>Cancel</button>
      {err ? <span style={{ color: 'var(--mlp-danger)' }}>{err}</span> : null}
    </div>
  );
};
