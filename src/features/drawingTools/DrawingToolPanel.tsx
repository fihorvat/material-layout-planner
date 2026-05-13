import { useDrawingToolStore } from '@/state';

type Props = {
  /** Label shown in the panel header, e.g. "Line tool". */
  title: string;
  /** Optional hint shown above the style inputs. */
  hint?: string;
};

/**
 * Shared defaults editor used by the Line, Rectangle and Polygon tools.
 * Sets the stroke color and thickness that will be applied to newly
 * drawn entities. Per-entity overrides remain available after selection.
 */
export const DrawingToolPanel = ({ title, hint }: Props) => {
  const style = useDrawingToolStore((s) => s.style);
  const setStrokeColor = useDrawingToolStore((s) => s.setStrokeColor);
  const setStrokeWidthPx = useDrawingToolStore((s) => s.setStrokeWidthPx);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontWeight: 600 }}>{title}</div>
      {hint ? (
        <div style={{ fontSize: 12, color: '#6b7280' }}>{hint}</div>
      ) : null}
      <label>
        Line color{' '}
        <input
          type="color"
          value={style.strokeColor}
          onChange={(e) => setStrokeColor(e.target.value)}
        />
      </label>
      <label>
        Line thickness (px){' '}
        <input
          type="number"
          min={0}
          step={0.5}
          value={style.strokeWidthPx}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (!Number.isFinite(v) || v < 0) return;
            setStrokeWidthPx(v);
          }}
          style={{ width: 80 }}
        />
      </label>
      <div style={{ fontSize: 11, color: '#6b7280' }}>
        These defaults apply to new shapes. Select a shape to edit its color
        and thickness individually.
      </div>
    </div>
  );
};
