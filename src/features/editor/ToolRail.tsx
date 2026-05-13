import { IconButton } from '@/components';
import { useEditorStore, useSelectionStore, type ToolId } from '@/state';
import { isToolEnabled, toolDisabledReason } from './toolAvailability';
import styles from './editor.module.css';

type ToolDef = { id: ToolId; label: string; shortcut: string; icon: string };
type ToolGroup = { id: string; label: string; tools: ToolDef[] };

const TOOL_GROUPS: ToolGroup[] = [
  {
    id: 'selection',
    label: 'Selection',
    tools: [{ id: 'select', label: 'Select', shortcut: 'V', icon: '\u2196' }],
  },
  {
    id: 'primitives',
    label: 'Drawing primitives',
    tools: [
      { id: 'line', label: 'Line', shortcut: 'L', icon: '/' },
      { id: 'rectangle', label: 'Rectangle', shortcut: 'R', icon: '\u25AD' },
      { id: 'polygon', label: 'Polygon', shortcut: 'P', icon: '\u2B20' },
      { id: 'cut', label: 'Cut (add points on edges)', shortcut: 'K', icon: '\u2700' },
    ],
  },
  {
    id: 'surfaces',
    label: 'Surfaces',
    tools: [
      { id: 'surface', label: 'Surface', shortcut: 'F', icon: 'S' },
      { id: 'opening', label: 'Opening', shortcut: 'O', icon: '\u229F' },
      { id: 'splitSurface', label: 'Split surface', shortcut: 'X', icon: '\u2702' },
      { id: 'connection', label: 'Connection', shortcut: 'C', icon: '\u2310' },
    ],
  },
  {
    id: 'annotations',
    label: 'Annotations',
    tools: [
      { id: 'dimension', label: 'Dimension', shortcut: 'D', icon: '\u2194' },
      { id: 'label', label: 'Label', shortcut: 'T', icon: 'T' },
    ],
  },
  {
    id: 'measurement',
    label: 'Measurement & layout',
    tools: [
      { id: 'meter', label: 'Meter (measure distances)', shortcut: 'M', icon: '\u{1F4CF}' },
      { id: 'patternOrigin', label: 'Pattern origin', shortcut: '', icon: '\u2316' },
    ],
  },
];

export const ToolRail = () => {
  const activeTool = useEditorStore((s) => s.activeTool);
  const setActiveTool = useEditorStore((s) => s.setActiveTool);
  const selected = useSelectionStore((s) => s.selected);
  const hasSurfaceSelected = selected.some((e) => e.kind === 'surface');
  return (
    <nav className={styles.toolRail} aria-label="Drawing tools">
      {TOOL_GROUPS.map((group, idx) => (
        <div
          key={group.id}
          className={[
            styles.toolRailGroup,
            idx > 0 ? styles.toolRailGroupDivider : '',
          ].join(' ')}
          role="group"
          aria-label={group.label}
        >
          {group.tools.map((t) => {
            const enabled = isToolEnabled(t.id, { hasSurfaceSelected });
            const reason = enabled ? undefined : toolDisabledReason(t.id);
            return (
              <IconButton
                key={t.id}
                label={t.label}
                shortcut={t.shortcut}
                active={activeTool === t.id}
                disabled={!enabled}
                disabledReason={reason}
                onClick={() => setActiveTool(t.id)}
              >
                <span aria-hidden>{t.icon}</span>
              </IconButton>
            );
          })}
        </div>
      ))}
    </nav>
  );
};
