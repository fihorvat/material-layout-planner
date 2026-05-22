import type { Project } from '@/types';
import type { ConnectionFormValues } from './connectionDefaults';
import {
  CONNECTION_TYPE_META,
  THICKNESS_MODE_META,
  ConnectionTypePreview,
  ThicknessModePreview,
  ConnectionVisualGrid,
  ConnectionVisualOption,
  OverlapSidePreview,
  createOverlapSideMeta,
} from './connectionDialogMeta';
import {
  getConnectionTypeDefaults,
  inferConnectionMaterialThicknessMm,
} from './connectionDefaults';

type ConnectionEditorFormProps = {
  project: Project;
  surfaceAId: string;
  surfaceBId: string;
  surfaceALabel: string;
  surfaceBLabel: string;
  value: ConnectionFormValues;
  onChange: (patch: Partial<ConnectionFormValues>) => void;
};

export const ConnectionEditorForm = ({
  project,
  surfaceAId,
  surfaceBId,
  surfaceALabel,
  surfaceBLabel,
  value,
  onChange,
}: ConnectionEditorFormProps) => {
  const fieldLabelStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    fontSize: 12,
  } as const;
  const helpTextStyle = { fontSize: 11, color: 'var(--mlp-muted)', lineHeight: 1.4 } as const;
  const sectionStyle = { display: 'flex', flexDirection: 'column', gap: 6 } as const;

  const selectedTypeMeta = CONNECTION_TYPE_META.find((entry) => entry.id === value.connectionType);
  const selectedThicknessMeta = THICKNESS_MODE_META.find(
    (entry) => entry.id === value.thicknessMode,
  );
  const inferredThicknessMm = inferConnectionMaterialThicknessMm(project, surfaceAId, surfaceBId);
  const overlapSideMeta = createOverlapSideMeta(surfaceALabel, surfaceBLabel);
  const selectedOverlapSideMeta = overlapSideMeta.find(
    (entry) => entry.id === value.physicalOverlapSide,
  );

  const onTypeChange = (connectionType: ConnectionFormValues['connectionType']) => {
    onChange(getConnectionTypeDefaults(connectionType, { project, surfaceAId, surfaceBId }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={sectionStyle}>
        <span>Type</span>
        <span style={helpTextStyle}>
          Choose how the two faces meet. The preview cards mirror the connection styles used
          elsewhere in the app.
        </span>
        <ConnectionVisualGrid minCardWidth={102}>
          {CONNECTION_TYPE_META.map((entry) => (
            <ConnectionVisualOption
              key={entry.id}
              label={entry.label}
              description={entry.description}
              selected={value.connectionType === entry.id}
              onSelect={() => onTypeChange(entry.id)}
            >
              <ConnectionTypePreview type={entry.id} />
            </ConnectionVisualOption>
          ))}
        </ConnectionVisualGrid>
        {selectedTypeMeta ? (
          <span style={helpTextStyle}>{selectedTypeMeta.description}</span>
        ) : null}
        {value.connectionType === 'buttJoint' ? (
          <span style={helpTextStyle}>
            Recommended preset: seam gap 0 mm, overlap enabled from {surfaceALabel}, and overlap
            distance set to{' '}
            {inferredThicknessMm > 0
              ? `${inferredThicknessMm} mm from the assigned material thickness`
              : '10 mm until a material thickness is available'}
            .
          </span>
        ) : null}
      </div>

      <label style={fieldLabelStyle}>
        <span>Angle ({'°'})</span>
        <span style={helpTextStyle}>
          The angle between the visible faces after the connection is folded. Use 180° for a flat
          continuation and 90° for a right-angle return.
        </span>
        <input
          type="number"
          value={value.angleDeg}
          onChange={(e) => onChange({ angleDeg: Number(e.target.value) })}
          step={1}
        />
      </label>

      <label style={fieldLabelStyle}>
        <span>Joint at connection (mm)</span>
        <span style={helpTextStyle}>
          The seam or gap left exactly at the shared edge before any overlap or thickness
          compensation is applied.
        </span>
        <input
          type="number"
          min={0}
          value={value.jointAtConnectionMm}
          onChange={(e) => onChange({ jointAtConnectionMm: Math.max(0, Number(e.target.value)) })}
        />
      </label>

      <div style={sectionStyle}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          <input
            type="checkbox"
            checked={value.allowPatternContinuation}
            onChange={(e) => onChange({ allowPatternContinuation: e.target.checked })}
          />
          <span>Allow pattern continuation</span>
        </label>
        <span style={helpTextStyle}>
          Connected surfaces in the same continuation chain reuse a shared pattern anchor so rows
          and columns do not restart from each surface&apos;s own top-left or center.
        </span>
        <span style={helpTextStyle}>
          This works best when the connected surfaces use compatible material and pattern settings.
        </span>
      </div>

      <div style={sectionStyle}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          <input
            type="checkbox"
            checked={value.allowPhysicalOverlap}
            onChange={(e) => onChange({ allowPhysicalOverlap: e.target.checked })}
          />
          <span>Allow physical overlap</span>
        </label>
        <span style={helpTextStyle}>
          Lets material extend past the connection edge instead of stopping flush at the boundary.
        </span>
      </div>

      {value.allowPhysicalOverlap ? (
        <>
          <div style={sectionStyle}>
            <span>Overlap side</span>
            <span style={helpTextStyle}>
              Choose which surface supplies the material that extends beyond the seam.
            </span>
            <ConnectionVisualGrid minCardWidth={112}>
              {overlapSideMeta.map((entry) => (
                <ConnectionVisualOption
                  key={entry.id}
                  label={entry.label}
                  description={entry.description}
                  selected={value.physicalOverlapSide === entry.id}
                  onSelect={() => onChange({ physicalOverlapSide: entry.id })}
                >
                  <OverlapSidePreview side={entry.id} />
                </ConnectionVisualOption>
              ))}
            </ConnectionVisualGrid>
            {selectedOverlapSideMeta ? (
              <span style={helpTextStyle}>{selectedOverlapSideMeta.description}</span>
            ) : null}
          </div>

          <label style={fieldLabelStyle}>
            <span>Default overlap (mm)</span>
            <span style={helpTextStyle}>
              Starting distance that material is allowed to run past the connection edge. Butt-joint
              presets use material thickness when the connected surfaces already have materials
              assigned.
            </span>
            <input
              type="number"
              min={0}
              value={value.defaultOverlapMm}
              onChange={(e) => onChange({ defaultOverlapMm: Math.max(0, Number(e.target.value)) })}
            />
          </label>

          <label style={fieldLabelStyle}>
            <span>Overlap opacity ({value.overlapOpacity.toFixed(2)})</span>
            <span style={helpTextStyle}>
              Visual opacity for the doubled-coverage overlay shown on the canvas and in layout
              outputs.
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={value.overlapOpacity}
              onChange={(e) => onChange({ overlapOpacity: Number(e.target.value) })}
            />
          </label>
        </>
      ) : null}

      <div style={sectionStyle}>
        <span>Thickness mode</span>
        <span style={helpTextStyle}>
          Choose how the connection should account for material thickness at the seam or covered
          edge.
        </span>
        <ConnectionVisualGrid minCardWidth={112}>
          {THICKNESS_MODE_META.map((entry) => (
            <ConnectionVisualOption
              key={entry.id}
              label={entry.label}
              description={entry.description}
              selected={value.thicknessMode === entry.id}
              onSelect={() => onChange({ thicknessMode: entry.id })}
            >
              <ThicknessModePreview mode={entry.id} />
            </ConnectionVisualOption>
          ))}
        </ConnectionVisualGrid>
        {selectedThicknessMeta ? (
          <span style={helpTextStyle}>{selectedThicknessMeta.description}</span>
        ) : null}
      </div>
    </div>
  );
};
