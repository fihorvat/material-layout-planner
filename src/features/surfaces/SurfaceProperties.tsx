import { useProjectStore, useSelectionStore } from '@/state';
import { dispatchCommand, updateSurfaceCommand, deleteSurfaceCommand, renameSurfaceCommand } from '@/domain/commands';
import { AssignPatternControl, PlacementPatternPanel } from '@/features/placementPatterns';

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
      <AssignPatternControl surfaceId={surface.id} value={surface.placementPatternId} />
      {surface.placementPatternId && (
        <details open style={{ borderTop: '1px solid #e5e7eb', paddingTop: 8 }}>
          <summary style={{ cursor: 'pointer', fontSize: 12, color: '#374151', marginBottom: 6 }}>
            Pattern settings
          </summary>
          <PlacementPatternPanel
            patternId={surface.placementPatternId}
            contextMaterialId={surface.materialId ?? null}
          />
        </details>
      )}
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
