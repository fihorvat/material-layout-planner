type Row = { keys: string; action: string; group: string };

const ROWS: Row[] = [
  { group: 'Tools', keys: 'V', action: 'Select tool' },
  { group: 'Tools', keys: 'L', action: 'Line tool' },
  { group: 'Tools', keys: 'R', action: 'Rectangle tool' },
  { group: 'Tools', keys: 'P', action: 'Polygon tool' },
  { group: 'Tools', keys: 'O', action: 'Opening tool' },
  { group: 'Tools', keys: 'F', action: 'Surface tool' },
  { group: 'Tools', keys: 'D', action: 'Dimension tool' },
  { group: 'Tools', keys: 'T', action: 'Label tool' },
  { group: 'Tools', keys: 'C', action: 'Connection tool' },
  { group: 'Tools', keys: 'X', action: 'Split surface tool' },
  { group: 'Editing', keys: 'Delete / Backspace', action: 'Delete selection' },
  { group: 'Editing', keys: 'Ctrl/Cmd + Z', action: 'Undo' },
  { group: 'Editing', keys: 'Ctrl/Cmd + Shift + Z / Ctrl + Y', action: 'Redo' },
  { group: 'Editing', keys: 'Ctrl/Cmd + D', action: 'Duplicate selection' },
  { group: 'Editing', keys: 'Esc', action: 'Cancel / clear selection' },
  { group: 'Editing', keys: 'Enter', action: 'Confirm numeric / close polygon' },
  { group: 'View', keys: 'Space + drag / Middle mouse drag', action: 'Pan' },
  { group: 'View', keys: 'Mouse wheel', action: 'Zoom at cursor' },
  { group: 'View', keys: '+ / -', action: 'Zoom in / out' },
  { group: 'View', keys: '0', action: 'Reset zoom' },
  { group: 'View', keys: 'Home', action: 'Fit content' },
  { group: 'View', keys: 'G', action: 'Toggle grid' },
  { group: 'View', keys: 'S', action: 'Toggle snap' },
  { group: 'File', keys: 'Ctrl/Cmd + S', action: 'Save (autosave)' },
  { group: 'File', keys: 'Ctrl/Cmd + E', action: 'Export PDF' },
  { group: 'File', keys: '? / F1', action: 'Show this help' },
];

export type ShortcutsHelpDialogProps = {
  open: boolean;
  onClose: () => void;
};

export const ShortcutsHelpDialog = ({ open, onClose }: ShortcutsHelpDialogProps) => {
  if (!open) return null;
  const groups = Array.from(new Set(ROWS.map((r) => r.group)));
  return (
    <div
      role="dialog"
      aria-label="Keyboard shortcuts"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.4)',
        zIndex: 8000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 8,
          padding: 20,
          minWidth: 480,
          maxHeight: '80vh',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Keyboard shortcuts</h2>
          <button type="button" onClick={onClose}>Close</button>
        </div>
        {groups.map((g) => (
          <section key={g} style={{ marginTop: 12 }}>
            <h3 style={{ fontSize: 13, color: '#6b7280', margin: '8px 0' }}>{g}</h3>
            <table style={{ width: '100%', fontSize: 13 }}>
              <tbody>
                {ROWS.filter((r) => r.group === g).map((r) => (
                  <tr key={r.keys}>
                    <td style={{ width: '50%', padding: 4 }}>
                      <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 3 }}>{r.keys}</code>
                    </td>
                    <td>{r.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>
    </div>
  );
};
