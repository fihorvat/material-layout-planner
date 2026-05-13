import { useEffect, useRef, useState } from 'react';
import { parseLength, ParseLengthError } from '@/domain/units';

export type NumericPromptOverlayProps = {
  onSubmit: (lengthMm: number, angleDeg: number) => void;
  onCancel: () => void;
  initialAngleDeg?: number;
};

const formatAngle = (deg: number): string => {
  const normalized = ((deg % 360) + 360) % 360;
  const rounded = Math.round(normalized * 10) / 10;
  return Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1);
};

export const NumericPromptOverlay = ({ onSubmit, onCancel, initialAngleDeg = 0 }: NumericPromptOverlayProps) => {
  const [length, setLength] = useState('');
  const [angle, setAngle] = useState(formatAngle(initialAngleDeg));
  const [err, setErr] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    ref.current?.focus();
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
