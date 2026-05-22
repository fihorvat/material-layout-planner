import { useEffect, useMemo, useState } from 'react';
import { useConnectionToolStore, useProjectStore } from '@/state';
import { dispatchCommand, addConnectionCommand } from '@/domain/commands';
import { makeConnection, validateConnection } from '@/domain/surfaces/connectSurfaces';
import { ModalCloseButton } from '@/components';
import { normalizeConnectionFormValues } from './connectionDefaults';
import { ConnectionEditorForm } from './ConnectionEditorForm';

export const SurfaceConnectionDialog = () => {
  const phase = useConnectionToolStore((s) => s.phase);
  const defaults = useConnectionToolStore((s) => s.defaults);
  const updateDefaults = useConnectionToolStore((s) => s.updateDefaults);
  const closeDialog = useConnectionToolStore((s) => s.closeDialog);
  const project = useProjectStore((s) => s.project);

  // Local form state, seeded from defaults when dialog opens.
  const [form, setForm] = useState(defaults);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    if (phase.kind === 'dialog') {
      setForm(normalizeConnectionFormValues(defaults));
      setError(null);
      setWarning(null);
    }
  }, [phase.kind, defaults]);

  const surfaces = useMemo(() => {
    if (phase.kind !== 'dialog') return null;
    const a = project.surfaces.find((s) => s.id === phase.surfaceAId);
    const b = project.surfaces.find((s) => s.id === phase.surfaceBId);
    return a && b ? { a, b } : null;
  }, [phase, project.surfaces]);

  if (phase.kind !== 'dialog') return null;

  const submit = () => {
    if (!surfaces) {
      setError('Surfaces not found');
      return;
    }
    const v = validateConnection(project.surfaces, project.surfaceConnections, {
      surfaceAId: phase.surfaceAId,
      edgeAIndex: phase.edgeAIndex,
      surfaceBId: phase.surfaceBId,
      edgeBIndex: phase.edgeBIndex,
      connectionType: form.connectionType,
      angleDeg: form.angleDeg,
      jointAtConnectionMm: form.jointAtConnectionMm,
      allowPatternContinuation: form.allowPatternContinuation,
      allowPhysicalOverlap: form.allowPhysicalOverlap,
      physicalOverlapSide: form.physicalOverlapSide,
      defaultOverlapMm: form.defaultOverlapMm,
      overlapOpacity: form.overlapOpacity,
      thicknessMode: form.thicknessMode,
    });
    if (!v.valid) {
      setError(v.issues.map((i) => i.message).join('; '));
      return;
    }
    if (v.warnings.length > 0) {
      setWarning(v.warnings.map((w) => w.message).join('; '));
    }
    const connection = makeConnection({
      surfaceAId: phase.surfaceAId,
      edgeAIndex: phase.edgeAIndex,
      surfaceBId: phase.surfaceBId,
      edgeBIndex: phase.edgeBIndex,
      connectionType: form.connectionType,
      angleDeg: form.angleDeg,
      jointAtConnectionMm: form.jointAtConnectionMm,
      allowPatternContinuation: form.allowPatternContinuation,
      allowPhysicalOverlap: form.allowPhysicalOverlap,
      physicalOverlapSide: form.physicalOverlapSide,
      defaultOverlapMm: form.defaultOverlapMm,
      overlapOpacity: form.overlapOpacity,
      thicknessMode: form.thicknessMode,
    });
    dispatchCommand(addConnectionCommand({ connection }));
    updateDefaults(form);
    closeDialog();
  };

  return (
    <div
      role="dialog"
      aria-label="Create connection"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.4)',
        zIndex: 8000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={closeDialog}
    >
      <div
        style={{
          background: 'var(--mlp-card, white)',
          color: 'var(--mlp-text)',
          border: '1px solid var(--mlp-border)',
          boxShadow: 'var(--mlp-shadow-lg)',
          borderRadius: 8,
          padding: 20,
          width: 560,
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: '85vh',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 16 }}>New connection</h2>
          <ModalCloseButton onClose={closeDialog} />
        </div>
        {surfaces ? (
          <p style={{ margin: '8px 0 12px', fontSize: 12, color: 'var(--mlp-muted)' }}>
            <strong>{surfaces.a.name}</strong> edge {phase.edgeAIndex + 1} {'↔'}{' '}
            <strong>{surfaces.b.name}</strong> edge {phase.edgeBIndex + 1}
          </p>
        ) : null}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ConnectionEditorForm
            project={project}
            surfaceAId={phase.surfaceAId}
            surfaceBId={phase.surfaceBId}
            surfaceALabel={surfaces?.a.name ?? 'Surface A'}
            surfaceBLabel={surfaces?.b.name ?? 'Surface B'}
            value={form}
            onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
          />

          {error ? (
            <div role="alert" style={{ color: 'var(--mlp-danger)', fontSize: 12 }}>
              {error}
            </div>
          ) : null}
          {warning ? (
            <div role="status" style={{ color: 'var(--mlp-warn, #b45309)', fontSize: 12 }}>
              {warning}
            </div>
          ) : null}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
            <button type="button" onClick={closeDialog}>
              Cancel
            </button>
            <button type="button" onClick={submit}>
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
