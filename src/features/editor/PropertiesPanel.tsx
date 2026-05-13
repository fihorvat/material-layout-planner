import { useEditorStore, useSelectionStore } from '@/state';
import { SurfaceProperties } from '@/features/surfaces/SurfaceProperties';
import { OpeningProperties } from '@/features/surfaces/OpeningProperties';
import { ConnectionProperties } from '@/features/surfaces/ConnectionProperties';
import { SplitSurfaceToolPanel } from '@/features/surfaces/SplitSurfaceToolPanel';
import { OpeningToolPanel } from '@/features/drawingTools/opening/OpeningToolPanel';
import { DrawingToolPanel } from '@/features/drawingTools/DrawingToolPanel';
import { DrawingEntityProperties } from '@/features/drawingTools/DrawingEntityProperties';
import { LabelProperties } from '@/features/drawingTools/label/LabelProperties';
import styles from './editor.module.css';

const TOOL_PANEL_TITLE: Partial<Record<string, { title: string; hint: string }>> = {
  line: { title: 'Line tool', hint: 'Click two points to draw a line. Chain points to build a polyline.' },
  rectangle: { title: 'Rectangle tool', hint: 'Drag from corner to corner. Hold Shift for square, Alt to draw from center.' },
  polygon: { title: 'Polygon tool', hint: 'Click points, then close on the first one (or press Enter).' },
  connection: { title: 'Connection tool', hint: 'Click an edge of surface A, then an edge of a different surface B. A dialog opens for type and settings.' },
  meter: { title: 'Meter tool', hint: 'Click two points to drop a dimensioned measurement line. Hold Shift to snap the point onto the nearest existing line/edge.' },
};

export type PropertiesPanelProps = {
  collapsed: boolean;
  onToggleCollapsed: () => void;
};

export const PropertiesPanel = ({ collapsed, onToggleCollapsed }: PropertiesPanelProps) => {
  const selected = useSelectionStore((s) => s.selected);
  const activeTool = useEditorStore((s) => s.activeTool);
  const connection = selected.find((e) => e.kind === 'connection');
  const surface = selected.find((e) => e.kind === 'surface');
  const opening = selected.find((e) => e.kind === 'opening');
  const label = selected.find((e) => e.kind === 'label');
  const shape = selected.find(
    (e) => e.kind === 'line' || e.kind === 'rectangle' || e.kind === 'polygon',
  );

  let body: React.ReactNode;
  if (connection) {
    body = <ConnectionProperties />;
  } else if (opening) {
    body = <OpeningProperties />;
  } else if (surface) {
    body = <SurfaceProperties />;
  } else if (label) {
    body = <LabelProperties />;
  } else if (shape) {
    body = <DrawingEntityProperties />;
  } else if (activeTool === 'splitSurface') {
    body = <SplitSurfaceToolPanel />;
  } else if (activeTool === 'opening') {
    body = <OpeningToolPanel />;
  } else if (
    activeTool === 'line' ||
    activeTool === 'rectangle' ||
    activeTool === 'polygon' ||
    activeTool === 'connection' ||
    activeTool === 'meter'
  ) {
    const meta = TOOL_PANEL_TITLE[activeTool]!;
    body = <DrawingToolPanel title={meta.title} hint={meta.hint} />;
  } else {
    body = 'Select an object to edit its properties.';
  }

  return (
    <aside
      className={collapsed ? styles.propertiesPanelCollapsed : styles.propertiesPanel}
      aria-label="Properties panel"
    >
      <div className={styles.panelHeader}>
        {!collapsed && <span>Properties</span>}
        <button
          type="button"
          className={styles.collapseBtn}
          aria-label={collapsed ? 'Expand properties panel' : 'Collapse properties panel'}
          aria-expanded={!collapsed}
          onClick={onToggleCollapsed}
        >
          {collapsed ? '\u25C0' : '\u25B6'}
        </button>
      </div>
      {!collapsed && <div className={styles.panelBody}>{body}</div>}
    </aside>
  );
};
