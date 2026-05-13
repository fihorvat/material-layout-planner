import { useState } from 'react';
import { Tabs, type TabItem } from '@/components';
import { SurfaceList } from '@/features/surfaces/SurfaceList';
import { ConnectionList } from '@/features/surfaces/ConnectionList';
import { MaterialList } from '@/features/materials/MaterialList';
import { PatternList } from '@/features/placementPatterns';
import { MaterialCutListTable } from '@/features/materialLayout/MaterialCutListTable';
import { LayoutsListPanel } from '@/features/materialLayout/LayoutsListPanel';
import { ProjectStatsPanel } from '@/features/materialLayout/ProjectStatsPanel';
import { InfoPanel } from '@/features/info';
import { WarningsPanel } from './WarningsPanel';
import styles from './editor.module.css';

const TABS: TabItem[] = [
  { id: 'surfaces', label: 'Surfaces' },
  { id: 'connections', label: 'Connections' },
  { id: 'materials', label: 'Materials' },
  { id: 'patterns', label: 'Patterns' },
  { id: 'layouts', label: 'Layouts' },
  { id: 'cutList', label: 'Cut list' },
  { id: 'warnings', label: 'Warnings' },
  { id: 'stats', label: 'Stats' },
  { id: 'info', label: 'Info' },
];

type BottomPanelProps = {
  collapsed: boolean;
  onToggleCollapsed: () => void;
};

export const BottomPanel = ({ collapsed, onToggleCollapsed }: BottomPanelProps) => {
  const [active, setActive] = useState('surfaces');
  return (
    <section className={styles.bottomPanel} aria-label="Bottom panel">
      <div className={styles.bottomHeader}>
        <Tabs tabs={TABS} active={active} onChange={setActive} />
        <button
          type="button"
          className={styles.collapseBtn}
          aria-label={collapsed ? 'Expand bottom panel' : 'Collapse bottom panel'}
          aria-expanded={!collapsed}
          onClick={onToggleCollapsed}
        >
          {collapsed ? '\u25B2' : '\u25BC'}
        </button>
      </div>
      <div className={collapsed ? styles.bottomBodyCollapsed : styles.bottomBody}>
        <BottomBody id={active} />
      </div>
    </section>
  );
};

const BottomBody = ({ id }: { id: string }) => {
  switch (id) {
    case 'surfaces':
      return <SurfaceList />;
    case 'connections':
      return <ConnectionList />;
    case 'materials':
      return <MaterialList />;
    case 'patterns':
      return <PatternList />;
    case 'layouts':
      return <LayoutsListPanel />;
    case 'cutList':
      return <MaterialCutListTable />;
    case 'warnings':
      return <WarningsPanel />;
    case 'stats':
      return <ProjectStatsPanel />;
    case 'info':
      return <InfoPanel />;
    default:
      return null;
  }
};
