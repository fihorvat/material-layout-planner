import { useEditorStore, useSelectionStore } from '@/state';
import { SurfaceProperties } from '@/features/surfaces/SurfaceProperties';
import { OpeningProperties } from '@/features/surfaces/OpeningProperties';
import { OpeningToolPanel } from '@/features/drawingTools/opening/OpeningToolPanel';
import { DrawingToolPanel } from '@/features/drawingTools/DrawingToolPanel';
import { DrawingEntityProperties } from '@/features/drawingTools/DrawingEntityProperties';
import styles from './editor.module.css';

const TOOL_PANEL_TITLE: Partial<Record<string, { title: string; hint: string }>> = {
  line: { title: 'Line tool', hint: 'Click two points to draw a line. Chain points to build a polyline.' },
  rectangle: { title: 'Rectangle tool', hint: 'Drag from corner to corner. Hold Shift for square, Alt to draw from center.' },
  polygon: { title: 'Polygon tool', hint: 'Click points, then close on the first one (or press Enter).' },
};

export const PropertiesPanel = () => {
  const selected = useSelectionStore((s) => s.selected);
  const activeTool = useEditorStore((s) => s.activeTool);
  const surface = selected.find((e) => e.kind === 'surface');
  const opening = selected.find((e) => e.kind === 'opening');
  const shape = selected.find(
    (e) => e.kind === 'line' || e.kind === 'rectangle' || e.kind === 'polygon',
  );

  let body: React.ReactNode;
  if (opening) {
    body = <OpeningProperties />;
  } else if (surface) {
    body = <SurfaceProperties />;
  } else if (shape) {
    body = <DrawingEntityProperties />;
  } else if (activeTool === 'opening') {
    body = <OpeningToolPanel />;
  } else if (
    activeTool === 'line' ||
    activeTool === 'rectangle' ||
    activeTool === 'polygon'
  ) {
    const meta = TOOL_PANEL_TITLE[activeTool]!;
    body = <DrawingToolPanel title={meta.title} hint={meta.hint} />;
  } else {
    body = 'Select an object to edit its properties.';
  }

  return (
    <aside className={styles.propertiesPanel} aria-label="Properties panel">
      <div className={styles.panelHeader}>Properties</div>
      <div className={styles.panelBody}>{body}</div>
    </aside>
  );
};
