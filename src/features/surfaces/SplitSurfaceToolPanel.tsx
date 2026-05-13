import { useProjectStore, useSelectionStore, useSplitToolStore, type SplitMode, type SplitInnerMode } from '@/state';

const MODES: { id: SplitMode; label: string; hint: string }[] = [
  { id: 'line', label: 'Line', hint: 'Click two points; line is extended to cut across the surface.' },
  { id: 'rectangle', label: 'Rectangle', hint: 'Drag from corner to corner.' },
  { id: 'polygon', label: 'Polygon', hint: 'Click vertices, close on the first one (or press Enter).' },
  { id: 'dimension', label: 'Dimension', hint: 'Click an edge, then enter an offset from its start.' },
];

const INNER_MODES: { id: SplitInnerMode; label: string }[] = [
  { id: 'extractInner', label: 'Extract inner as new surface' },
  { id: 'subtractInner', label: 'Subtract inner (leave a frame)' },
];

export const SplitSurfaceToolPanel = () => {
  const mode = useSplitToolStore((s) => s.mode);
  const setMode = useSplitToolStore((s) => s.setMode);
  const innerMode = useSplitToolStore((s) => s.innerMode);
  const setInnerMode = useSplitToolStore((s) => s.setInnerMode);

  const selection = useSelectionStore((s) => s.selected);
  const project = useProjectStore((s) => s.project);
  const selectedSurface = selection.find((e) => e.kind === 'surface');
  const target = selectedSurface
    ? project.surfaces.find((s) => s.id === selectedSurface.id) ?? null
    : null;

  const showInnerMode = mode === 'rectangle' || mode === 'polygon';
  const currentHint = MODES.find((m) => m.id === mode)?.hint ?? '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontWeight: 600, fontSize: 13 }}>Split surface</div>
      <p style={{ margin: 0, fontSize: 12, color: 'var(--mlp-muted)' }}>
        {target
          ? `Splitting: ${target.name}`
          : 'Select a surface first (or click on one to target it).'}
      </p>
      <div role="radiogroup" aria-label="Split mode" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {MODES.map((m) => (
          <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <input
              type="radio"
              name="split-mode"
              checked={mode === m.id}
              onChange={() => setMode(m.id)}
            />
            <span>{m.label}</span>
          </label>
        ))}
      </div>
      <p style={{ margin: 0, fontSize: 11, color: 'var(--mlp-muted)' }}>{currentHint}</p>

      {showInnerMode ? (
        <fieldset style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 8, border: '1px solid var(--mlp-border)', borderRadius: 4 }}>
          <legend style={{ fontSize: 11, color: 'var(--mlp-muted)' }}>Result</legend>
          {INNER_MODES.map((m) => (
            <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <input
                type="radio"
                name="split-inner-mode"
                checked={innerMode === m.id}
                onChange={() => setInnerMode(m.id)}
              />
              <span>{m.label}</span>
            </label>
          ))}
        </fieldset>
      ) : null}
    </div>
  );
};
