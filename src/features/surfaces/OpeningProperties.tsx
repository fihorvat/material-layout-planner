import { useProjectStore, useSelectionStore } from '@/state';
import {
  dispatchCommand,
  removeOpeningCommand,
  updateOpeningCommand,
  findOpeningSurface,
} from '@/domain/commands';
import type { DrawingStyle } from '@/types';

export const OpeningProperties = () => {
  const selection = useSelectionStore((s) => s.selected);
  const project = useProjectStore((s) => s.project);

  const entry = selection.find((e) => e.kind === 'opening');
  if (!entry) return null;
  const found = findOpeningSurface(project, entry.id);
  if (!found) return null;
  const { surface } = found;
  const meta = surface.holeMeta.find((m) => m.id === entry.id);
  if (!meta) return null;

  const setMeta = (patch: Partial<{ name: string; showDimensions: boolean; style: DrawingStyle }>) => {
    const metaPatch: { name?: string; showDimensions?: boolean; style?: DrawingStyle } = {};
    if (patch.name !== undefined) metaPatch.name = patch.name;
    if (patch.showDimensions !== undefined) metaPatch.showDimensions = patch.showDimensions;
    if (patch.style !== undefined) metaPatch.style = patch.style;
    dispatchCommand(
      updateOpeningCommand({
        surfaceId: surface.id,
        openingId: meta.id,
        patch: { meta: metaPatch },
      }),
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontWeight: 600 }}>Opening</div>
      <label>
        Name{' '}
        <input
          value={meta.name ?? ''}
          onChange={(e) => setMeta({ name: e.target.value })}
        />
      </label>
      <label>
        <input
          type="checkbox"
          checked={meta.showDimensions}
          onChange={(e) => setMeta({ showDimensions: e.target.checked })}
        />
        Show dimensions
      </label>
      <label>
        Line color{' '}
        <input
          type="color"
          value={meta.style.strokeColor}
          onChange={(e) => setMeta({ style: { ...meta.style, strokeColor: e.target.value } })}
        />
      </label>
      <label>
        Line thickness (px){' '}
        <input
          type="number"
          min={0}
          step={0.5}
          value={meta.style.strokeWidthPx}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (!Number.isFinite(v) || v < 0) return;
            setMeta({ style: { ...meta.style, strokeWidthPx: v } });
          }}
          style={{ width: 80 }}
        />
      </label>
      <div style={{ fontSize: 12, color: '#6b7280' }}>
        Parent surface: <strong>{surface.name}</strong>
      </div>
      <button
        type="button"
        onClick={() =>
          dispatchCommand(removeOpeningCommand({ surfaceId: surface.id, openingId: meta.id }))
        }
      >
        Delete opening
      </button>
    </div>
  );
};
