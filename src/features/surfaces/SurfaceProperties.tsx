import { useProjectStore, useSelectionStore } from '@/state';
import { dispatchCommand, updateSurfaceCommand, deleteSurfaceCommand, renameSurfaceCommand } from '@/domain/commands';

export const SurfaceProperties = () => {
  const selection = useSelectionStore((s) => s.selected);
  const project = useProjectStore((s) => s.project);

  const entry = selection.find((e) => e.kind === 'surface');
  if (!entry) return null;
  const surface = project.surfaces.find((s) => s.id === entry.id);
  if (!surface) return null;

  const onPatch = <K extends keyof typeof surface>(key: K, value: typeof surface[K]) => {
    dispatchCommand(updateSurfaceCommand({ id: surface.id, patch: { [key]: value } as Partial<typeof surface> }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <label>
        Name{' '}
        <input
          value={surface.name}
          onChange={(e) =>
            dispatchCommand(renameSurfaceCommand({ id: surface.id, name: e.target.value }))
          }
        />
      </label>
      <label>
        Material{' '}
        <select
          value={surface.materialId ?? ''}
          onChange={(e) => onPatch('materialId', e.target.value || null)}
        >
          <option value="">— None —</option>
          {project.materials.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </label>
      <label>
        Pattern{' '}
        <select
          value={surface.placementPatternId ?? ''}
          onChange={(e) => onPatch('placementPatternId', e.target.value || null)}
        >
          <option value="">— None —</option>
          {project.placementPatterns.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </label>
      <label>
        <input type="checkbox" checked={surface.showName} onChange={(e) => onPatch('showName', e.target.checked)} />
        Show name
      </label>
      <label>
        <input type="checkbox" checked={surface.showDimensions} onChange={(e) => onPatch('showDimensions', e.target.checked)} />
        Show dimensions
      </label>
      <label>
        <input type="checkbox" checked={surface.showArea} onChange={(e) => onPatch('showArea', e.target.checked)} />
        Show area
      </label>
      <button type="button" onClick={() => dispatchCommand(deleteSurfaceCommand({ id: surface.id }))}>
        Delete surface
      </button>
    </div>
  );
};
