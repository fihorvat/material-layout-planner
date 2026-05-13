import { ModalCloseButton } from '@/components';

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
  { group: 'Editing', keys: 'Ctrl/Cmd + A', action: 'Select all' },
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

type ShortcutsHelpDialogProps = {
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
        background: 'var(--mlp-overlay)',
        zIndex: 8000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(2px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--mlp-card)',
          color: 'var(--mlp-text)',
          border: '1px solid var(--mlp-border)',
          boxShadow: 'var(--mlp-shadow-lg)',
          borderRadius: 'var(--mlp-radius-lg)',
          padding: '20px 24px 24px',
          minWidth: 520,
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: '80vh',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 4,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em' }}>
            Keyboard shortcuts
          </h2>
          <ModalCloseButton onClose={onClose} />
        </div>
        {groups.map((g) => (
          <section key={g} style={{ marginTop: 16 }}>
            <h3
              style={{
                fontSize: 11,
                color: 'var(--mlp-muted)',
                margin: '8px 0',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 600,
              }}
            >
              {g}
            </h3>
            <table style={{ width: '100%', fontSize: 13 }}>
              <tbody>
                {ROWS.filter((r) => r.group === g).map((r) => (
                  <tr key={r.keys}>
                    <td style={{ width: '50%', padding: '4px 4px 4px 0' }}>
                      <kbd>{r.keys}</kbd>
                    </td>
                    <td style={{ color: 'var(--mlp-text)' }}>{r.action}</td>
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
