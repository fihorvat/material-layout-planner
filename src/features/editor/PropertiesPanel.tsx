import { useEditorStore, useSelectionStore } from '@/state';
import { SurfaceProperties } from '@/features/surfaces/SurfaceProperties';
import { OpeningProperties } from '@/features/surfaces/OpeningProperties';
import { OpeningToolPanel } from '@/features/drawingTools/opening/OpeningToolPanel';
import styles from './editor.module.css';

export const PropertiesPanel = () => {
  const selected = useSelectionStore((s) => s.selected);
  const activeTool = useEditorStore((s) => s.activeTool);
  const surface = selected.find((e) => e.kind === 'surface');
  const opening = selected.find((e) => e.kind === 'opening');

  let body: React.ReactNode;
  if (opening) {
    body = <OpeningProperties />;
  } else if (surface) {
    body = <SurfaceProperties />;
  } else if (activeTool === 'opening') {
    body = <OpeningToolPanel />;
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
