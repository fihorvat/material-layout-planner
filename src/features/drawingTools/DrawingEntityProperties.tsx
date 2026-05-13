import { useProjectStore, useSelectionStore } from '@/state';
import {
  dispatchCommand,
  updateDrawingEntityCommand,
  deleteDrawingEntityCommand,
} from '@/domain/commands';
import type { DrawingEntity, DrawingStyle } from '@/types';

const TITLE: Record<DrawingEntity['type'], string> = {
  line: 'Line',
  rectangle: 'Rectangle',
  polygon: 'Polygon',
};

/**
 * Properties editor for a selected line, rectangle or polygon entity.
 * Exposes the stroke color and thickness (and fill color/opacity for the
 * filled shape types) so the user can tweak existing shapes in place.
 */
export const DrawingEntityProperties = () => {
  const selection = useSelectionStore((s) => s.selected);
  const project = useProjectStore((s) => s.project);

  const entry = selection.find(
    (e) => e.kind === 'line' || e.kind === 'rectangle' || e.kind === 'polygon',
  );
  if (!entry) return null;
  const entity = project.drawingEntities.find((e) => e.id === entry.id);
  if (!entity) return null;

  const setStyle = (next: DrawingStyle) => {
    dispatchCommand(
      updateDrawingEntityCommand({ id: entity.id, patch: { style: next } }),
    );
  };

  const hasFill = entity.type !== 'line';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontWeight: 600 }}>{TITLE[entity.type]}</div>
      <label>
        Line color{' '}
        <input
          type="color"
          value={entity.style.strokeColor}
          onChange={(e) =>
            setStyle({ ...entity.style, strokeColor: e.target.value })
          }
        />
      </label>
      <label>
        Line thickness (px){' '}
        <input
          type="number"
          min={0}
          step={0.5}
          value={entity.style.strokeWidthPx}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (!Number.isFinite(v) || v < 0) return;
            setStyle({ ...entity.style, strokeWidthPx: v });
          }}
          style={{ width: 80 }}
        />
      </label>
      {hasFill ? (
        <>
          <label>
            Fill color{' '}
            <input
              type="color"
              value={entity.style.fillColor ?? '#ffffff'}
              onChange={(e) =>
                setStyle({ ...entity.style, fillColor: e.target.value })
              }
            />
          </label>
          <label>
            Fill opacity{' '}
            <input
              type="number"
              min={0}
              max={1}
              step={0.05}
              value={entity.style.fillOpacity ?? 1}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (!Number.isFinite(v)) return;
                const clamped = Math.max(0, Math.min(1, v));
                setStyle({ ...entity.style, fillOpacity: clamped });
              }}
              style={{ width: 80 }}
            />
          </label>
        </>
      ) : null}
      <button
        type="button"
        onClick={() => dispatchCommand(deleteDrawingEntityCommand({ id: entity.id }))}
      >
        Delete {TITLE[entity.type].toLowerCase()}
      </button>
    </div>
  );
};
