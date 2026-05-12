import { useSelectionStore } from '@/state';
import { SurfaceProperties } from '@/features/surfaces/SurfaceProperties';
import styles from './editor.module.css';

export const PropertiesPanel = () => {
  const selected = useSelectionStore((s) => s.selected);
  const surface = selected.find((e) => e.kind === 'surface');
  return (
    <aside className={styles.propertiesPanel} aria-label="Properties panel">
      <div className={styles.panelHeader}>Properties</div>
      <div className={styles.panelBody}>
        {surface ? <SurfaceProperties /> : 'Select an object to edit its properties.'}
      </div>
    </aside>
  );
};
