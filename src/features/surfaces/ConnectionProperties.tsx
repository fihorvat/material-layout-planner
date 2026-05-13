import type { SurfaceConnection } from '@/types';
import { useProjectStore, useSelectionStore } from '@/state';
import {
  dispatchCommand,
  updateConnectionCommand,
  deleteConnectionCommand,
} from '@/domain/commands';
import { decodeEdgeId } from '@/domain/surfaces/connectSurfaces';

const CONNECTION_TYPES: { id: SurfaceConnection['connectionType']; label: string }[] = [
  { id: 'outsideCorner', label: 'Outside corner' },
  { id: 'insideCorner', label: 'Inside corner' },
  { id: 'flatContinuation', label: 'Flat continuation' },
  { id: 'buttJoint', label: 'Butt joint' },
  { id: 'custom', label: 'Custom' },
];

const THICKNESS_MODES: { id: SurfaceConnection['thicknessMode']; label: string }[] = [
  { id: 'ignoreThickness', label: 'Ignore thickness' },
  { id: 'showThicknessOnly', label: 'Show thickness only' },
  { id: 'compensateCoveredEdge', label: 'Compensate covered edge' },
  { id: 'customAllowance', label: 'Custom allowance' },
];

export const ConnectionProperties = () => {
  const selection = useSelectionStore((s) => s.selected);
  const project = useProjectStore((s) => s.project);

  const entry = selection.find((e) => e.kind === 'connection');
  if (!entry) return null;
  const c = project.surfaceConnections.find((cn) => cn.id === entry.id);
  if (!c) return null;

  const patch = (p: Partial<SurfaceConnection>) => {
    dispatchCommand(updateConnectionCommand({ id: c.id, patch: p }));
  };

  const surfaceName = (id: string) => project.surfaces.find((s) => s.id === id)?.name ?? id;
  const edgeLabel = (edgeId: string) => decodeEdgeId(edgeId).edgeIndex + 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 12, color: 'var(--mlp-muted)' }}>
        {surfaceName(c.surfaceAId)} (edge {edgeLabel(c.edgeAId)}) {'↔'}{' '}
        {surfaceName(c.surfaceBId)} (edge {edgeLabel(c.edgeBId)})
      </div>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
        <span>Type</span>
        <select
          value={c.connectionType}
          onChange={(e) => patch({ connectionType: e.target.value as SurfaceConnection['connectionType'] })}
        >
          {CONNECTION_TYPES.map((t) => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
        <span>Angle ({'°'})</span>
        <input
          type="number"
          value={c.angleDeg}
          onChange={(e) => patch({ angleDeg: Number(e.target.value) })}
        />
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
        <span>Joint at connection (mm)</span>
        <input
          type="number"
          min={0}
          value={c.jointAtConnectionMm}
          onChange={(e) => patch({ jointAtConnectionMm: Math.max(0, Number(e.target.value)) })}
        />
      </label>

      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
        <input
          type="checkbox"
          checked={c.allowPatternContinuation}
          onChange={(e) => patch({ allowPatternContinuation: e.target.checked })}
        />
        <span>Allow pattern continuation</span>
      </label>

      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
        <input
          type="checkbox"
          checked={c.allowPhysicalOverlap}
          onChange={(e) => patch({ allowPhysicalOverlap: e.target.checked })}
        />
        <span>Allow physical overlap</span>
      </label>

      {c.allowPhysicalOverlap ? (
        <>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
            <span>Default overlap (mm)</span>
            <input
              type="number"
              min={0}
              value={c.defaultOverlapMm}
              onChange={(e) => patch({ defaultOverlapMm: Math.max(0, Number(e.target.value)) })}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
            <span>Overlap opacity ({c.overlapOpacity.toFixed(2)})</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={c.overlapOpacity}
              onChange={(e) => patch({ overlapOpacity: Number(e.target.value) })}
            />
          </label>
        </>
      ) : null}

      <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
        <span>Thickness mode</span>
        <select
          value={c.thicknessMode}
          onChange={(e) => patch({ thicknessMode: e.target.value as SurfaceConnection['thicknessMode'] })}
        >
          {THICKNESS_MODES.map((t) => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
      </label>

      <button
        type="button"
        onClick={() => dispatchCommand(deleteConnectionCommand({ id: c.id }))}
      >
        Delete connection
      </button>
    </div>
  );
};
