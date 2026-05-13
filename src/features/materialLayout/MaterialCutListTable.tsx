import { useEffect, useState } from 'react';
import { useProjectStore } from '@/state';
import { buildCutList } from '@/domain/materialLayout/materialCutList';
import { dispatchCommand, changeProjectSettingsCommand } from '@/domain/commands';
import editorStyles from '@/features/editor/editor.module.css';

const summarizeCodes = (codes: string[]): string => {
  if (codes.length <= 2) return codes.join(', ');
  return `${codes[0]}, ${codes[1]} +${codes.length - 2}`;
};

// Accepts dot- or comma-decimal so European users can type "2,5".
const parseKerf = (raw: string): number | null => {
  const normalized = raw.trim().replace(',', '.');
  if (normalized === '') return null;
  const n = Number(normalized);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
};

const BladeKerfInput = () => {
  const bladeKerfMm = useProjectStore((s) => s.project.settings.bladeKerfMm);
  // Keep a local string so the user can type freely (e.g. partial "2,").
  // We only commit a valid parsed value to the store.
  const [draft, setDraft] = useState<string>(() => String(bladeKerfMm));

  // Re-sync when the canonical value changes from elsewhere (undo/redo, load).
  useEffect(() => {
    setDraft(String(bladeKerfMm));
  }, [bladeKerfMm]);

  const commit = (raw: string) => {
    const parsed = parseKerf(raw);
    if (parsed === null || parsed === bladeKerfMm) return;
    dispatchCommand(
      changeProjectSettingsCommand(
        { patch: { bladeKerfMm: parsed } },
        'Change blade thickness',
      ),
    );
  };

  return (
    <label
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 12,
        color: 'var(--mlp-muted)',
      }}
    >
      Blade thickness (kerf)
      <input
        type="text"
        inputMode="decimal"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        }}
        aria-label="Blade thickness in millimeters"
        style={{
          width: 70,
          padding: '3px 6px',
          background: 'var(--mlp-bg)',
          color: 'var(--mlp-text)',
          border: '1px solid var(--mlp-border-strong)',
          borderRadius: 4,
          fontSize: 13,
        }}
      />
      <span>mm</span>
    </label>
  );
};

export const MaterialCutListTable = () => {
  const project = useProjectStore((s) => s.project);
  const items = buildCutList(project);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <BladeKerfInput />
      {items.length === 0 ? (
        <p style={{ margin: 0 }}>No cut list yet. Generate a material layout first.</p>
      ) : (
        <table className={editorStyles.dataTable}>
      <thead>
        <tr>
          <th>Piece</th>
          <th>Surface</th>
          <th>Material</th>
          <th>Size (mm)</th>
          <th>Qty</th>
          <th>Thickness</th>
          <th>Overlap</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>
        {items.map((it, i) => (
          <tr key={i}>
            <td>{summarizeCodes(it.pieceCodes)}</td>
            <td>{it.surfaceName}</td>
            <td>{it.materialName}</td>
            <td>{it.widthMm} {'\u00D7'} {it.heightMm}</td>
            <td>{it.quantity}</td>
            <td>{it.thicknessMm}</td>
            <td>{it.overlapIncluded ? 'Yes' : '—'}</td>
            <td>{it.notes.join('; ')}</td>
          </tr>
        ))}
      </tbody>
        </table>
      )}
    </div>
  );
};
