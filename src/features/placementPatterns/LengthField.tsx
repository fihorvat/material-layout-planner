import { useEffect, useState } from 'react';
import { parseLength, ParseLengthError } from '@/domain/units';

export type LengthFieldProps = {
  label: string;
  valueMm: number;
  onCommit: (mm: number) => void;
  disabled?: boolean;
  allowNegative?: boolean;
  placeholder?: string;
};

const formatInitial = (mm: number): string => {
  if (!Number.isFinite(mm)) return '0';
  return String(mm);
};

export const LengthField = ({
  label,
  valueMm,
  onCommit,
  disabled,
  allowNegative,
  placeholder,
}: LengthFieldProps) => {
  const [text, setText] = useState<string>(formatInitial(valueMm));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setText(formatInitial(valueMm));
    setError(null);
  }, [valueMm]);

  const commit = () => {
    const trimmed = text.trim();
    if (trimmed === '') {
      setText(formatInitial(valueMm));
      setError(null);
      return;
    }
    try {
      const sign = allowNegative && trimmed.startsWith('-') ? -1 : 1;
      const body = sign === -1 ? trimmed.slice(1) : trimmed;
      const parsed = parseLength(body);
      const mm = sign * parsed.mm;
      if (mm !== valueMm) onCommit(mm);
      setError(null);
    } catch (e) {
      setError(
        e instanceof ParseLengthError ? `Invalid value (${e.code})` : 'Invalid value',
      );
    }
  };

  return (
    <label
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        fontSize: 12,
        color: 'var(--mlp-muted)',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <span>{label}</span>
      <input
        value={text}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            (e.target as HTMLInputElement).blur();
          } else if (e.key === 'Escape') {
            setText(formatInitial(valueMm));
            setError(null);
            (e.target as HTMLInputElement).blur();
          }
        }}
        style={{
          padding: '4px 6px',
          color: 'var(--mlp-text)',
          background: disabled ? 'var(--mlp-surface-2)' : 'var(--mlp-bg)',
          border: `1px solid ${error ? 'var(--mlp-danger)' : 'var(--mlp-border-strong)'}`,
          borderRadius: 4,
          fontSize: 13,
        }}
      />
      {error && <span style={{ color: 'var(--mlp-danger)', fontSize: 11 }}>{error}</span>}
    </label>
  );
};
