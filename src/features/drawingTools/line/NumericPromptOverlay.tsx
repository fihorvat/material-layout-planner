import { useEffect, useRef, useState } from 'react';
import { parseLength, ParseLengthError } from '@/domain/units';

export type NumericPromptOverlayProps = {
  onSubmit: (lengthMm: number, angleDeg: number) => void;
  onCancel: () => void;
};

export const NumericPromptOverlay = ({ onSubmit, onCancel }: NumericPromptOverlayProps) => {
  const [length, setLength] = useState('');
  const [angle, setAngle] = useState('0');
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
        background: 'white',
        border: '1px solid #cbd5e1',
        padding: 8,
        borderRadius: 6,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        display: 'flex',
        gap: 8,
        alignItems: 'center',
      }}
      role="dialog"
      aria-label="Enter line length and angle"
    >
      <label>
        Length{' '}
        <input
          ref={ref}
          value={length}
          onChange={(e) => setLength(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
            if (e.key === 'Escape') onCancel();
          }}
          style={{ width: 80 }}
        />
      </label>
      <label>
        Angle{' '}
        <input
          value={angle}
          onChange={(e) => setAngle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
            if (e.key === 'Escape') onCancel();
          }}
          style={{ width: 60 }}
        />
      </label>
      <button type="button" onClick={submit}>OK</button>
      <button type="button" onClick={onCancel}>Cancel</button>
      {err ? <span style={{ color: '#dc2626' }}>{err}</span> : null}
    </div>
  );
};
