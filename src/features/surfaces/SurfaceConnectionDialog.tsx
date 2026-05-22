import { useEffect, useMemo, useState } from 'react';
import type { SurfaceConnection } from '@/types';
import {
  useConnectionToolStore,
  useProjectStore,
} from '@/state';
import { dispatchCommand, addConnectionCommand } from '@/domain/commands';
import { makeConnection, validateConnection } from '@/domain/surfaces/connectSurfaces';
import { ModalCloseButton } from '@/components';
import {
  CONNECTION_TYPE_META,
  THICKNESS_MODE_META,
  ConnectionTypePreview,
  ThicknessModePreview,
  ConnectionVisualGrid,
  ConnectionVisualOption,
} from './connectionDialogMeta';
import {
  getConnectionTypeDefaults,
  inferConnectionMaterialThicknessMm,
} from './connectionDefaults';

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

  const fieldLabelStyle = { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 } as const;
  const helpTextStyle = { fontSize: 11, color: 'var(--mlp-muted)', lineHeight: 1.4 } as const;
  const sectionStyle = { display: 'flex', flexDirection: 'column', gap: 6 } as const;
  const selectedTypeMeta = CONNECTION_TYPE_META.find((entry) => entry.id === form.connectionType);
  const selectedThicknessMeta = THICKNESS_MODE_META.find((entry) => entry.id === form.thicknessMode);
  const inferredThicknessMm = surfaces
    ? inferConnectionMaterialThicknessMm(project, surfaces.a.id, surfaces.b.id)
    : 0;

  const setField = <K extends keyof typeof form>(key: K, value: typeof form[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onTypeChange = (id: SurfaceConnection['connectionType']) => {
    setForm((prev) => ({
      ...prev,
      ...getConnectionTypeDefaults(id, {
        project,
        surfaceAId: phase.surfaceAId,
        surfaceBId: phase.surfaceBId,
      }),
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
          <div style={sectionStyle}>
            <span>Type</span>
            <span style={helpTextStyle}>
              Choose how the two faces meet. The preview cards mirror the connection styles used elsewhere in the app.
            </span>
            <ConnectionVisualGrid minCardWidth={102}>
              {CONNECTION_TYPE_META.map((entry) => (
                <ConnectionVisualOption
                  key={entry.id}
                  label={entry.label}
                  description={entry.description}
                  selected={form.connectionType === entry.id}
                  onSelect={() => onTypeChange(entry.id)}
                >
                  <ConnectionTypePreview type={entry.id} />
                </ConnectionVisualOption>
              ))}
            </ConnectionVisualGrid>
            {selectedTypeMeta ? (
              <span style={helpTextStyle}>{selectedTypeMeta.description}</span>
            ) : null}
            {form.connectionType === 'buttJoint' ? (
              <span style={helpTextStyle}>
                Recommended preset: seam gap 0 mm, overlap enabled, and overlap distance set to{' '}
                {inferredThicknessMm > 0 ? `${inferredThicknessMm} mm from the assigned material thickness` : '10 mm until a material thickness is available'}.
              </span>
            ) : null}
          </div>

          <label style={fieldLabelStyle}>
            <span>Angle ({'°'})</span>
            <span style={helpTextStyle}>
              The angle between the visible faces after the connection is folded. Use 180° for a flat continuation and 90° for a right-angle return.
            </span>
            <input
              type="number"
              value={form.angleDeg}
              onChange={(e) => setField('angleDeg', Number(e.target.value))}
              step={1}
            />
          </label>

          <label style={fieldLabelStyle}>
            <span>Joint at connection (mm)</span>
            <span style={helpTextStyle}>
              The seam or gap left exactly at the shared edge before any overlap or thickness compensation is applied.
            </span>
            <input
              type="number"
              min={0}
              value={form.jointAtConnectionMm}
              onChange={(e) => setField('jointAtConnectionMm', Math.max(0, Number(e.target.value)))}
            />
          </label>

          <div style={sectionStyle}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <input
                type="checkbox"
                checked={form.allowPatternContinuation}
                onChange={(e) => setField('allowPatternContinuation', e.target.checked)}
              />
              <span>Allow pattern continuation</span>
            </label>
            <span style={helpTextStyle}>
              Intended to let rows, tiles, or panels continue through the connection instead of restarting on the next surface.
            </span>
            <span style={helpTextStyle}>
              Current status: this preference is saved on the connection, but it does not change generated pattern alignment yet.
            </span>
          </div>

          <div style={sectionStyle}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <input
                type="checkbox"
                checked={form.allowPhysicalOverlap}
                onChange={(e) => setField('allowPhysicalOverlap', e.target.checked)}
              />
              <span>Allow physical overlap</span>
            </label>
            <span style={helpTextStyle}>
              Lets material extend past the connection edge instead of stopping flush at the boundary.
            </span>
            <span style={helpTextStyle}>
              Current behavior applies the same overlap distance on the connected edge from either side; donor-side control is not implemented yet.
            </span>
          </div>

          {form.allowPhysicalOverlap ? (
            <>
              <label style={fieldLabelStyle}>
                <span>Default overlap (mm)</span>
                <span style={helpTextStyle}>
                  Starting distance that material is allowed to run past the connection edge. Butt-joint presets use material thickness when the connected surfaces already have materials assigned.
                </span>
                <input
                  type="number"
                  min={0}
                  value={form.defaultOverlapMm}
                  onChange={(e) => setField('defaultOverlapMm', Math.max(0, Number(e.target.value)))}
                />
              </label>
              <label style={fieldLabelStyle}>
                <span>Overlap opacity ({form.overlapOpacity.toFixed(2)})</span>
                <span style={helpTextStyle}>
                  Visual opacity for the doubled-coverage overlay shown on the canvas and in layout outputs.
                </span>
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

          <div style={sectionStyle}>
            <span>Thickness mode</span>
            <span style={helpTextStyle}>
              Choose how the connection should account for material thickness at the seam or covered edge.
            </span>
            <ConnectionVisualGrid minCardWidth={112}>
              {THICKNESS_MODE_META.map((entry) => (
                <ConnectionVisualOption
                  key={entry.id}
                  label={entry.label}
                  description={entry.description}
                  selected={form.thicknessMode === entry.id}
                  onSelect={() => setField('thicknessMode', entry.id)}
                >
                  <ThicknessModePreview mode={entry.id} />
                </ConnectionVisualOption>
              ))}
            </ConnectionVisualGrid>
            {selectedThicknessMeta ? (
              <span style={helpTextStyle}>{selectedThicknessMeta.description}</span>
            ) : null}
          </div>

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
