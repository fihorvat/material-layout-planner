import { useOpeningToolStore } from '@/state';
import { commitOpeningFromSelection } from '@/domain/surfaces/commitOpeningFromSelection';

const modeButtonStyle = (active: boolean): React.CSSProperties => ({
  padding: '6px 10px',
  border: '1px solid #d1d5db',
  borderRadius: 4,
  background: active ? '#2563eb' : '#f9fafb',
  color: active ? '#ffffff' : '#111827',
  cursor: 'pointer',
  fontSize: 12,
});

export const OpeningToolPanel = () => {
  const mode = useOpeningToolStore((s) => s.mode);
  const setMode = useOpeningToolStore((s) => s.setMode);
  const showDimensions = useOpeningToolStore((s) => s.showDimensions);
  const setShowDimensions = useOpeningToolStore((s) => s.setShowDimensions);
  const style = useOpeningToolStore((s) => s.style);
  const setStyle = useOpeningToolStore((s) => s.setStyle);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontWeight: 600 }}>Opening tool</div>
      <div style={{ fontSize: 12, color: '#6b7280' }}>
        Punch a hole into a surface. The first click determines the parent
        surface; the opening must stay inside it.
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          type="button"
          style={modeButtonStyle(mode === 'rectangle')}
          onClick={() => setMode('rectangle')}
        >
          Rectangle
        </button>
        <button
          type="button"
          style={modeButtonStyle(mode === 'polygon')}
          onClick={() => setMode('polygon')}
        >
          Polygon
        </button>
        <button
          type="button"
          style={modeButtonStyle(false)}
          onClick={() => {
            commitOpeningFromSelection();
          }}
        >
          From selection
        </button>
      </div>
      <label>
        <input
          type="checkbox"
          checked={showDimensions}
          onChange={(e) => setShowDimensions(e.target.checked)}
        />
        Show dimensions on new openings
      </label>
      <label>
        Line color{' '}
        <input
          type="color"
          value={style.strokeColor}
          onChange={(e) => setStyle({ ...style, strokeColor: e.target.value })}
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
            setStyle({ ...style, strokeWidthPx: v });
          }}
          style={{ width: 80 }}
        />
      </label>
      <div style={{ fontSize: 11, color: '#6b7280' }}>
        Polygon mode: click points, press <kbd>Enter</kbd> to close,{' '}
        <kbd>Backspace</kbd> removes the last vertex, <kbd>Esc</kbd> cancels.
      </div>
    </div>
  );
};
