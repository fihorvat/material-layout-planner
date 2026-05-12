import styles from './editor.module.css';

export const PropertiesPanel = () => {
  return (
    <aside className={styles.propertiesPanel} aria-label="Properties panel">
      <div className={styles.panelHeader}>Properties</div>
      <div className={styles.panelBody}>Select an object to edit its properties.</div>
    </aside>
  );
};
