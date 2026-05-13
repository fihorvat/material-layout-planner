import { useProjectStore, useSelectionStore } from '@/state';
import {
  dispatchCommand,
  updateLabelCommand,
  deleteLabelCommand,
} from '@/domain/commands';
import type { LabelEntity, TextStyle } from '@/types';

/**
 * Properties editor for a selected label entity. Allows editing the text,
 * font size, bold/italic, color, rotation, and anchor offset; plus a
 * delete action.
 */
export const LabelProperties = () => {
  const selection = useSelectionStore((s) => s.selected);
  const project = useProjectStore((s) => s.project);

  const entry = selection.find((e) => e.kind === 'label');
  if (!entry) return null;
  const label = project.labels.find((l) => l.id === entry.id);
  if (!label) return null;

  const patch = (p: Partial<LabelEntity>) => {
    dispatchCommand(updateLabelCommand({ id: label.id, patch: p }));
  };
  const patchStyle = (s: Partial<TextStyle>) => {
    patch({ style: { ...label.style, ...s } });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontWeight: 600 }}>Label</div>
      <label>
        Text{' '}
        <input
          value={label.text}
          onChange={(e) => patch({ text: e.target.value })}
        />
      </label>
      <label>
        Font size (px){' '}
        <input
          type="number"
          min={1}
          step={1}
          value={label.style.fontSizePx}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (!Number.isFinite(v) || v <= 0) return;
            patchStyle({ fontSizePx: v });
          }}
          style={{ width: 80 }}
        />
      </label>
      <label>
        Color{' '}
        <input
          type="color"
          value={label.style.textColor}
          onChange={(e) => patchStyle({ textColor: e.target.value })}
        />
      </label>
      <div style={{ display: 'flex', gap: 12 }}>
        <label>
          <input
            type="checkbox"
            checked={label.style.bold}
            onChange={(e) => patchStyle({ bold: e.target.checked })}
          />{' '}
          Bold
        </label>
        <label>
          <input
            type="checkbox"
            checked={label.style.italic}
            onChange={(e) => patchStyle({ italic: e.target.checked })}
          />{' '}
          Italic
        </label>
      </div>
      <label>
        Rotation (deg){' '}
        <input
          type="number"
          step={1}
          value={label.rotationDeg}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (!Number.isFinite(v)) return;
            patch({ rotationDeg: v });
          }}
          style={{ width: 80 }}
        />
      </label>
      <div style={{ display: 'flex', gap: 8 }}>
        <label>
          X (mm){' '}
          <input
            type="number"
            step={1}
            value={Math.round(label.position.x * 100) / 100}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (!Number.isFinite(v)) return;
              patch({ position: { x: v, y: label.position.y } });
            }}
            style={{ width: 80 }}
          />
        </label>
        <label>
          Y (mm){' '}
          <input
            type="number"
            step={1}
            value={Math.round(label.position.y * 100) / 100}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (!Number.isFinite(v)) return;
              patch({ position: { x: label.position.x, y: v } });
            }}
            style={{ width: 80 }}
          />
        </label>
      </div>
      <button
        type="button"
        onClick={() => dispatchCommand(deleteLabelCommand({ id: label.id }))}
      >
        Delete label
      </button>
    </div>
  );
};
