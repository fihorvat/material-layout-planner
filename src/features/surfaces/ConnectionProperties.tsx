import { useProjectStore, useSelectionStore } from '@/state';
import {
  dispatchCommand,
  updateConnectionCommand,
  deleteConnectionCommand,
} from '@/domain/commands';
import { decodeEdgeId } from '@/domain/surfaces/connectSurfaces';
import { ConnectionEditorForm } from './ConnectionEditorForm';
import { normalizeConnectionFormValues } from './connectionDefaults';

export const ConnectionProperties = () => {
  const selection = useSelectionStore((s) => s.selected);
  const project = useProjectStore((s) => s.project);

  const entry = selection.find((e) => e.kind === 'connection');
  if (!entry) return null;
  const c = project.surfaceConnections.find((cn) => cn.id === entry.id);
  if (!c) return null;

  const patch = (p: Partial<typeof c>) => {
    dispatchCommand(updateConnectionCommand({ id: c.id, patch: p }));
  };

  const surfaceName = (id: string) => project.surfaces.find((s) => s.id === id)?.name ?? id;
  const edgeLabel = (edgeId: string) => decodeEdgeId(edgeId).edgeIndex + 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 12, color: 'var(--mlp-muted)' }}>
        {surfaceName(c.surfaceAId)} (edge {edgeLabel(c.edgeAId)}) {'↔'} {surfaceName(c.surfaceBId)}{' '}
        (edge {edgeLabel(c.edgeBId)})
      </div>

      <ConnectionEditorForm
        project={project}
        surfaceAId={c.surfaceAId}
        surfaceBId={c.surfaceBId}
        surfaceALabel={surfaceName(c.surfaceAId)}
        surfaceBLabel={surfaceName(c.surfaceBId)}
        value={normalizeConnectionFormValues(c)}
        onChange={patch}
      />

      <button type="button" onClick={() => dispatchCommand(deleteConnectionCommand({ id: c.id }))}>
        Delete connection
      </button>
    </div>
  );
};
