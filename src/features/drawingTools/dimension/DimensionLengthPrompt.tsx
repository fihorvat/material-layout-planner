import { useEffect, useRef, useState } from 'react';
import { parseLength, ParseLengthError, formatLength } from '@/domain/units';
import {
  useDimensionEditStore,
  useProjectStore,
} from '@/state';
import { applyEdgeLength, getEdgeLength } from './applyEdgeLength';

export const DimensionLengthPrompt = () => {
  const editing = useDimensionEditStore((s) => s.editing);

  if (!editing) return null;
  return <PromptInner key={JSON.stringify(editing)} />;
};

const PromptInner = () => {
  const editing = useDimensionEditStore((s) => s.editing);
  const cancelEdit = useDimensionEditStore((s) => s.cancelEdit);
  const project = useProjectStore((s) => s.project);
  const current = editing ? getEdgeLength(project, editing) : null;
  const [value, setValue] = useState(current != null ? formatLength(current) : '');
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  if (!editing) return null;

  const submit = () => {
    try {
      const lp = parseLength(value);
      if (lp.mm <= 0) {
        setErr('Length must be positive');
        return;
      }
      const ok = applyEdgeLength(useProjectStore.getState().project, editing, lp.mm);
      if (!ok) {
        setErr('Could not apply length');
        return;
      }
      cancelEdit();
    } catch (e) {
      if (e instanceof ParseLengthError) setErr(`Length: ${e.code}`);
      else setErr('Invalid input');
    }
  };

  const label =
    editing.kind === 'line'
      ? 'Line length'
      : editing.kind === 'rectWidth'
        ? 'Rectangle width'
        : editing.kind === 'rectHeight'
          ? 'Rectangle height'
          : editing.kind === 'polygonEdge'
            ? `Polygon edge ${editing.edgeIndex + 1}`
            : `Surface edge ${editing.edgeIndex + 1}`;

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
      aria-label={`Edit ${label}`}
    >
      <label style={{ fontSize: 12, color: 'var(--mlp-text)' }}>
        {label}{' '}
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
              cancelEdit();
            }
          }}
          style={{
            width: 110,
            background: 'var(--mlp-bg)',
            color: 'var(--mlp-text)',
            border: '1px solid var(--mlp-border-strong)',
            borderRadius: 4,
            padding: '2px 6px',
          }}
          aria-label={label}
        />
      </label>
      <button type="button" onClick={submit}>
        OK
      </button>
      <button type="button" onClick={cancelEdit}>
        Cancel
      </button>
      {err ? <span style={{ color: 'var(--mlp-danger)', fontSize: 12 }}>{err}</span> : null}
    </div>
  );
};
