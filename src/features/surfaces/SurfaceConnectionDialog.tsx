import { useEffect, useMemo, useState } from 'react';
import type { SurfaceConnection } from '@/types';
import {
  useConnectionToolStore,
  useProjectStore,
} from '@/state';
import { dispatchCommand, addConnectionCommand } from '@/domain/commands';
import { makeConnection, validateConnection } from '@/domain/surfaces/connectSurfaces';
import { ModalCloseButton } from '@/components';

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
      // Seed angle based on type default unless user already changed it.
      const baseAngle = defaults.connectionType === 'flatContinuation' ? 180 : 90;
      setForm({ ...defaults, angleDeg: defaults.angleDeg || baseAngle });
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

  const setField = <K extends keyof typeof form>(key: K, value: typeof form[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onTypeChange = (id: SurfaceConnection['connectionType']) => {
    setForm((prev) => ({
      ...prev,
      connectionType: id,
      angleDeg: id === 'flatContinuation' ? 180 : prev.angleDeg || 90,
    }));
  };

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
          width: 460,
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
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
            <span>Type</span>
            <select
              value={form.connectionType}
              onChange={(e) => onTypeChange(e.target.value as SurfaceConnection['connectionType'])}
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
              value={form.angleDeg}
              onChange={(e) => setField('angleDeg', Number(e.target.value))}
              step={1}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
            <span>Joint at connection (mm)</span>
            <input
              type="number"
              min={0}
              value={form.jointAtConnectionMm}
              onChange={(e) => setField('jointAtConnectionMm', Math.max(0, Number(e.target.value)))}
            />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <input
              type="checkbox"
              checked={form.allowPatternContinuation}
              onChange={(e) => setField('allowPatternContinuation', e.target.checked)}
            />
            <span>Allow pattern continuation</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <input
              type="checkbox"
              checked={form.allowPhysicalOverlap}
              onChange={(e) => setField('allowPhysicalOverlap', e.target.checked)}
            />
            <span>Allow physical overlap</span>
          </label>

          {form.allowPhysicalOverlap ? (
            <>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
                <span>Default overlap (mm)</span>
                <input
                  type="number"
                  min={0}
                  value={form.defaultOverlapMm}
                  onChange={(e) => setField('defaultOverlapMm', Math.max(0, Number(e.target.value)))}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
                <span>Overlap opacity ({form.overlapOpacity.toFixed(2)})</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={form.overlapOpacity}
                  onChange={(e) => setField('overlapOpacity', Number(e.target.value))}
                />
              </label>
            </>
          ) : null}

          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
            <span>Thickness mode</span>
            <select
              value={form.thicknessMode}
              onChange={(e) => setField('thicknessMode', e.target.value as SurfaceConnection['thicknessMode'])}
            >
              {THICKNESS_MODES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </label>

          {error ? (
            <div role="alert" style={{ color: 'var(--mlp-danger)', fontSize: 12 }}>{error}</div>
          ) : null}
          {warning ? (
            <div role="status" style={{ color: 'var(--mlp-warn, #b45309)', fontSize: 12 }}>{warning}</div>
          ) : null}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
            <button type="button" onClick={closeDialog}>Cancel</button>
            <button type="button" onClick={submit}>Create</button>
          </div>
        </div>
      </div>
    </div>
  );
};
