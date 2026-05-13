import { useEffect, useRef, useState } from 'react';
import { parseLength, ParseLengthError, formatLength } from '@/domain/units';
import { useProjectStore, useSplitToolStore } from '@/state';
import { distance } from '@/domain/geometry';

export type SplitDimensionPromptProps = {
  onSubmit: (input: { surfaceId: string; edgeIndex: number; offsetMm: number }) => boolean;
};

export const SplitDimensionPrompt = ({ onSubmit }: SplitDimensionPromptProps) => {
  const pending = useSplitToolStore((s) => s.dimensionPending);
  const setPending = useSplitToolStore((s) => s.setDimensionPending);
  const project = useProjectStore((s) => s.project);

  if (!pending) return null;

  const surface = project.surfaces.find((s) => s.id === pending.surfaceId);
  const a = surface?.outerBoundary[pending.edgeIndex];
  const b = surface?.outerBoundary[(pending.edgeIndex + 1) % (surface?.outerBoundary.length ?? 1)];
  const edgeLen = a && b ? distance(a, b) : 0;

  return (
    <PromptInner
      key={`${pending.surfaceId}#${pending.edgeIndex}`}
      edgeLen={edgeLen}
      onSubmit={(offsetMm) => {
        const ok = onSubmit({
          surfaceId: pending.surfaceId,
          edgeIndex: pending.edgeIndex,
          offsetMm,
        });
        if (ok) setPending(null);
        return ok;
      }}
      onCancel={() => setPending(null)}
    />
  );
};

const PromptInner = ({
  edgeLen,
  onSubmit,
  onCancel,
}: {
  edgeLen: number;
  onSubmit: (offsetMm: number) => boolean;
  onCancel: () => void;
}) => {
  const initial = Math.max(0, edgeLen / 2);
  const [value, setValue] = useState(formatLength(initial));
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const submit = () => {
    try {
      const lp = parseLength(value);
      if (lp.mm <= 0 || lp.mm >= edgeLen) {
        setErr(`Offset must be between 0 and ${formatLength(edgeLen)}`);
        return;
      }
      const ok = onSubmit(lp.mm);
      if (!ok) setErr('Split failed');
    } catch (e) {
      if (e instanceof ParseLengthError) setErr(`Length: ${e.code}`);
      else setErr('Invalid input');
    }
  };

  return (
    <div
      role="dialog"
      aria-label="Split at dimension"
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
    >
      <label style={{ fontSize: 12 }}>
        Offset from edge start
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setErr(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              submit();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              onCancel();
            }
          }}
          style={{
            width: 110,
            marginLeft: 6,
            background: 'var(--mlp-bg)',
            color: 'var(--mlp-text)',
            border: '1px solid var(--mlp-border-strong)',
            borderRadius: 4,
            padding: '2px 6px',
          }}
        />
      </label>
      <span style={{ fontSize: 11, color: 'var(--mlp-muted)' }}>
        edge: {formatLength(edgeLen)}
      </span>
      <button type="button" onClick={submit}>
        Split
      </button>
      <button type="button" onClick={onCancel}>
        Cancel
      </button>
      {err ? <span style={{ color: 'var(--mlp-danger)', fontSize: 12 }}>{err}</span> : null}
    </div>
  );
};
