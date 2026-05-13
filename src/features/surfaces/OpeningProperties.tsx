import { useProjectStore, useSelectionStore } from '@/state';
import {
  dispatchCommand,
  removeOpeningCommand,
  updateOpeningCommand,
  findOpeningSurface,
} from '@/domain/commands';
import type { DrawingStyle, Point2D } from '@/types';

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

  const setMeta = (
    patch: Partial<{
      name: string;
      showDimensions: boolean;
      style: DrawingStyle;
      labelOffset: Point2D | undefined;
    }>,
  ) => {
    const metaPatch: {
      name?: string;
      showDimensions?: boolean;
      style?: DrawingStyle;
      labelOffset?: Point2D;
    } = {};
    if (patch.name !== undefined) metaPatch.name = patch.name;
    if (patch.showDimensions !== undefined) metaPatch.showDimensions = patch.showDimensions;
    if (patch.style !== undefined) metaPatch.style = patch.style;
    if ('labelOffset' in patch) metaPatch.labelOffset = patch.labelOffset;
    dispatchCommand(
      updateOpeningCommand({
        surfaceId: surface.id,
        openingId: meta.id,
        patch: { meta: metaPatch },
      }),
    );
  };

  const fillEnabled = meta.style.fillColor !== undefined;
  const fillColorValue = meta.style.fillColor ?? '#ffffff';
  const fillOpacityValue = meta.style.fillOpacity ?? 1;

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
      <label>
        <input
          type="checkbox"
          checked={fillEnabled}
          onChange={(e) => {
            if (e.target.checked) {
              setMeta({
                style: {
                  ...meta.style,
                  fillColor: fillColorValue,
                  fillOpacity: fillOpacityValue,
                },
              });
            } else {
              const nextStyle: DrawingStyle = { ...meta.style };
              delete nextStyle.fillColor;
              delete nextStyle.fillOpacity;
              setMeta({ style: nextStyle });
            }
          }}
        />
        Fill background
      </label>
      {fillEnabled && (
        <>
          <label>
            Fill color{' '}
            <input
              type="color"
              value={fillColorValue}
              onChange={(e) =>
                setMeta({
                  style: {
                    ...meta.style,
                    fillColor: e.target.value,
                    fillOpacity: fillOpacityValue,
                  },
                })
              }
            />
          </label>
          <label>
            Fill opacity{' '}
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={fillOpacityValue}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (!Number.isFinite(v)) return;
                setMeta({
                  style: { ...meta.style, fillColor: fillColorValue, fillOpacity: v },
                });
              }}
            />
            <span style={{ marginLeft: 6, fontSize: 12 }}>{fillOpacityValue.toFixed(2)}</span>
          </label>
        </>
      )}
      {meta.name && (
        <button
          type="button"
          disabled={!meta.labelOffset}
          onClick={() => setMeta({ labelOffset: undefined })}
        >
          Reset label position
        </button>
      )}
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
