import { IconButton } from '@/components';
import { useEditorStore, type ToolId } from '@/state';
import styles from './editor.module.css';

type ToolDef = { id: ToolId; label: string; shortcut: string; icon: string };

const TOOLS: ToolDef[] = [
  { id: 'select', label: 'Select', shortcut: 'V', icon: '\u2196' },
  { id: 'line', label: 'Line', shortcut: 'L', icon: '/' },
  { id: 'rectangle', label: 'Rectangle', shortcut: 'R', icon: '\u25AD' },
  { id: 'polygon', label: 'Polygon', shortcut: 'P', icon: '\u2B20' },
  { id: 'opening', label: 'Opening', shortcut: 'O', icon: '\u25A2' },
  { id: 'surface', label: 'Surface', shortcut: 'F', icon: 'S' },
  { id: 'dimension', label: 'Dimension', shortcut: 'D', icon: '\u2194' },
  { id: 'label', label: 'Label', shortcut: 'T', icon: 'T' },
  { id: 'connection', label: 'Connection', shortcut: 'C', icon: '\u2310' },
  { id: 'splitSurface', label: 'Split surface', shortcut: 'X', icon: '\u2702' },
  { id: 'cut', label: 'Cut (add points on edges)', shortcut: 'K', icon: '\u2700' },
  { id: 'meter', label: 'Meter (measure distances)', shortcut: 'M', icon: '\u21A4\u21A6' },
  { id: 'patternOrigin', label: 'Pattern origin', shortcut: '', icon: '\u2316' },
];

export const ToolRail = () => {
  const activeTool = useEditorStore((s) => s.activeTool);
  const setActiveTool = useEditorStore((s) => s.setActiveTool);
  return (
    <nav className={styles.toolRail} aria-label="Drawing tools">
      {TOOLS.map((t) => (
        <IconButton
          key={t.id}
          label={t.label}
          shortcut={t.shortcut}
          active={activeTool === t.id}
          onClick={() => setActiveTool(t.id)}
        >
          <span aria-hidden>{t.icon}</span>
        </IconButton>
      ))}
    </nav>
  );
};
