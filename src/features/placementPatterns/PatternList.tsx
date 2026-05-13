import { useState } from 'react';
import type { PlacementPattern } from '@/types';
import { useProjectStore } from '@/state';
import { dispatchCommand, deletePlacementPatternCommand } from '@/domain/commands';
import { PatternInUseError } from '@/domain/commands/builtin/placementPatternCommands';
import { isPlacementPatternUsed } from '@/domain/placementPatterns/placementPattern';
import { PlacementPatternEditorDialog } from './PlacementPatternEditorDialog';
import editorStyles from '@/features/editor/editor.module.css';

const typeLabel = (t: PlacementPattern['type']): string => {
  switch (t) {
    case 'stacked':
      return 'Stacked';
    case 'verticalStacked':
      return 'Stacked vert.';
    case 'runningBondHalf':
      return 'Bond ½';
    case 'runningBondThird':
      return 'Bond ⅓';
    case 'customOffset':
      return 'Custom offset';
    case 'diagonal':
      return 'Diagonal';
    default:
      return t;
  }
};

export const PatternList = () => {
  const project = useProjectStore((s) => s.project);
  const patterns = project.placementPatterns;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);

  const openCreate = () => {
    setEditingId(undefined);
    setDialogOpen(true);
  };
  const openEdit = (id: string) => {
    setEditingId(id);
    setDialogOpen(true);
  };
  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(undefined);
  };

  const usedCount = (id: string): number =>
    project.surfaces.filter((s) => s.placementPatternId === id).length +
    project.materialLayouts.filter((l) => l.placementPatternId === id).length;

  const onDelete = (p: PlacementPattern) => {
    if (isPlacementPatternUsed(project, p.id)) {
      window.alert(
        `Cannot delete "${p.name}" — it is referenced by a surface or layout. Unassign it first.`,
      );
      return;
    }
    if (!window.confirm(`Delete pattern "${p.name}"?`)) return;
    try {
      dispatchCommand(deletePlacementPatternCommand({ id: p.id }));
    } catch (e) {
      if (e instanceof PatternInUseError) return;
      throw e;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong style={{ fontSize: 13 }}>Patterns</strong>
        <button type="button" onClick={openCreate}>
          + Add pattern
        </button>
      </div>

      {patterns.length === 0 ? (
        <p style={{ margin: 0, color: 'var(--mlp-muted)', fontSize: 13 }}>
          No patterns yet. Click <em>Add pattern</em> to create one.
        </p>
      ) : (
        <table className={editorStyles.dataTable}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Joint</th>
              <th>Used by</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {patterns.map((p) => {
              const count = usedCount(p.id);
              return (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{typeLabel(p.type)}</td>
                  <td>{p.jointMm} mm</td>
                  <td>{count}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button type="button" onClick={() => openEdit(p.id)} style={{ marginRight: 4 }}>
                      Edit
                    </button>
                    <button type="button" onClick={() => onDelete(p)} disabled={count > 0}>
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <PlacementPatternEditorDialog
        open={dialogOpen}
        patternId={editingId}
        onClose={closeDialog}
      />
    </div>
  );
};
