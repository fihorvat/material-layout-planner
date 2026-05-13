import { useState } from 'react';
import type { Material } from '@/types';
import { useProjectStore } from '@/state';
import { dispatchCommand, deleteMaterialCommand } from '@/domain/commands';
import { MaterialInUseError } from '@/domain/commands/builtin/materialCommands';
import { MaterialEditor } from './MaterialEditor';
import editorStyles from '@/features/editor/editor.module.css';

export const MaterialList = () => {
  const materials = useProjectStore((s) => s.project.materials);
  const surfaces = useProjectStore((s) => s.project.surfaces);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Material | undefined>(undefined);

  const usedCount = (id: string): number =>
    surfaces.filter((s) => s.materialId === id).length;

  const openCreate = () => {
    setEditing(undefined);
    setEditorOpen(true);
  };
  const openEdit = (m: Material) => {
    setEditing(m);
    setEditorOpen(true);
  };
  const closeEditor = () => {
    setEditorOpen(false);
    setEditing(undefined);
  };

  const onDelete = (m: Material) => {
    const count = usedCount(m.id);
    if (count > 0) {
      window.alert(
        `Cannot delete "${m.name}" — it is assigned to ${count} surface${
          count === 1 ? '' : 's'
        }. Unassign it first.`,
      );
      return;
    }
    if (!window.confirm(`Delete material "${m.name}"?`)) return;
    try {
      dispatchCommand(deleteMaterialCommand({ id: m.id }));
    } catch (e) {
      if (e instanceof MaterialInUseError) {
        // toast already shown by dispatcher; keep silent here
        return;
      }
      throw e;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong style={{ fontSize: 13 }}>Materials</strong>
        <button type="button" onClick={openCreate}>
          + Add material
        </button>
      </div>

      {materials.length === 0 ? (
        <p style={{ margin: 0, color: 'var(--mlp-muted)', fontSize: 13 }}>
          No materials yet. Click <em>Add material</em> to create one.
        </p>
      ) : (
        <table className={editorStyles.dataTable}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Unit size (mm)</th>
              <th>Joint</th>
              <th>Used by</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {materials.map((m) => {
              const count = usedCount(m.id);
              return (
                <tr key={m.id}>
                  <td>
                    <span
                      aria-hidden
                      style={{
                        display: 'inline-block',
                        width: 12,
                        height: 12,
                        borderRadius: 2,
                        background: m.style.fillColor,
                        border: '1px solid var(--mlp-border-strong)',
                        marginRight: 6,
                        verticalAlign: 'middle',
                      }}
                    />
                    {m.name}
                  </td>
                  <td>
                    {m.unitWidthMm} × {m.unitHeightMm} × {m.thicknessMm}
                  </td>
                  <td>{m.defaultJointMm} mm</td>
                  <td>{count}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button type="button" onClick={() => openEdit(m)} style={{ marginRight: 4 }}>
                      Edit
                    </button>
                    <button type="button" onClick={() => onDelete(m)} disabled={count > 0}>
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <MaterialEditor open={editorOpen} material={editing} onClose={closeEditor} />
    </div>
  );
};
