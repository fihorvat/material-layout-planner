import { useMemo } from 'react';
import type { PlacementPattern, OptimizationPriority } from '@/types';
import { useProjectStore } from '@/state';
import {
  dispatchCommand,
  updatePlacementPatternCommand,
  deletePlacementPatternCommand,
} from '@/domain/commands';
import { PatternInUseError } from '@/domain/commands/builtin/placementPatternCommands';
import { isPlacementPatternUsed } from '@/domain/placementPatterns/placementPattern';
import { LengthField } from './LengthField';
import { OptimizationPanel } from './OptimizationPanel';
import {
  VisualOption,
  VisualOptionGrid,
  TypePreview,
  OrientationPreview,
  OriginPreview,
  DirectionPreview,
  SymmetryPreview,
  TYPE_META,
  ORIENTATION_META,
  ORIGIN_META,
  DIRECTION_META,
  SYMMETRY_META,
} from './PatternVisuals';

const labelStyle = (disabled = false): React.CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  fontSize: 12,
  color: 'var(--mlp-muted)',
  opacity: disabled ? 0.6 : 1,
});

const inputStyle = (disabled = false): React.CSSProperties => ({
  padding: '4px 6px',
  background: disabled ? 'var(--mlp-surface-2)' : 'var(--mlp-bg)',
  color: 'var(--mlp-text)',
  border: '1px solid var(--mlp-border-strong)',
  borderRadius: 4,
  fontSize: 13,
});

export type PlacementPatternPanelProps = {
  patternId: string;
  /** When true, panel is rendered standalone (e.g. inside a modal). Show delete + heading. */
  showHeader?: boolean;
  /** Material context for percent <-> mm conversion of row offsets. */
  contextMaterialId?: string | null;
  onDeleted?: () => void;
};

const TYPE_LOCKS_ROW_OFFSET: ReadonlySet<PlacementPattern['type']> = new Set([
  'stacked',
  'verticalStacked',
  'runningBondHalf',
  'runningBondThird',
  'diagonal',
]);

export const PlacementPatternPanel = ({
  patternId,
  showHeader = false,
  contextMaterialId,
  onDeleted,
}: PlacementPatternPanelProps) => {
  const project = useProjectStore((s) => s.project);
  const pattern = useMemo(
    () => project.placementPatterns.find((p) => p.id === patternId),
    [project.placementPatterns, patternId],
  );
  const material = useMemo(
    () => project.materials.find((m) => m.id === contextMaterialId) ?? null,
    [project.materials, contextMaterialId],
  );

  if (!pattern) {
    return (
      <p style={{ margin: 0, color: 'var(--mlp-muted)', fontSize: 12 }}>
        Pattern not found (id: {patternId}).
      </p>
    );
  }

  const patch = (p: Partial<PlacementPattern>) =>
    dispatchCommand(updatePlacementPatternCommand({ id: pattern.id, patch: p }));

  const patchPriority = (p: Partial<OptimizationPriority>) =>
    patch({ optimizationPriority: { ...pattern.optimizationPriority, ...p } });

  const onDelete = () => {
    if (isPlacementPatternUsed(project, pattern.id)) {
      window.alert(
        `Cannot delete "${pattern.name}" — it is referenced by a surface or layout. Unassign it first.`,
      );
      return;
    }
    if (!window.confirm(`Delete pattern "${pattern.name}"?`)) return;
    try {
      dispatchCommand(deletePlacementPatternCommand({ id: pattern.id }));
      onDeleted?.();
    } catch (e) {
      if (e instanceof PatternInUseError) return;
      throw e;
    }
  };

  const rowOffsetTypeLocked = TYPE_LOCKS_ROW_OFFSET.has(pattern.type);
  const customAngle = pattern.orientation === 'customAngle';
  const customOriginVisible = pattern.originMode === 'customPoint';
  const percentDisabled = !material;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {showHeader && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <strong style={{ fontSize: 13 }}>Pattern</strong>
          <button type="button" onClick={onDelete}>
            Delete
          </button>
        </div>
      )}

      <label style={labelStyle()}>
        <span>Name</span>
        <input
          value={pattern.name}
          onChange={(e) => patch({ name: e.target.value })}
          style={inputStyle()}
        />
      </label>

      <p
        style={{
          margin: 0,
          padding: '6px 8px',
          background: 'var(--mlp-surface-2)',
          border: '1px solid var(--mlp-border)',
          borderRadius: 4,
          fontSize: 12,
          color: 'var(--mlp-muted)',
        }}
      >
        Dimensions are in <strong>millimeters</strong> by default. You can also type
        <code style={{ margin: '0 4px' }}>600 mm</code>,
        <code style={{ margin: '0 4px' }}>60 cm</code> or
        <code style={{ margin: '0 4px' }}>0.6 m</code>.
      </p>

      <div style={labelStyle()}>
        <span>Type</span>
        <VisualOptionGrid minCardWidth={80}>
          {TYPE_META.map((opt) => (
            <VisualOption
              key={opt.value}
              label={opt.label}
              description={opt.description}
              selected={pattern.type === opt.value}
              onSelect={() => patch({ type: opt.value })}
            >
              <TypePreview type={opt.value} />
            </VisualOption>
          ))}
        </VisualOptionGrid>
      </div>

      <div style={labelStyle()}>
        <span>Orientation</span>
        <VisualOptionGrid minCardWidth={90}>
          {ORIENTATION_META.map((opt) => (
            <VisualOption
              key={opt.value}
              label={opt.label}
              description={opt.description}
              selected={pattern.orientation === opt.value}
              onSelect={() => patch({ orientation: opt.value })}
            >
              <OrientationPreview orientation={opt.value} />
            </VisualOption>
          ))}
        </VisualOptionGrid>
      </div>

      <label style={labelStyle(!customAngle)}>
        <span>Angle (deg)</span>
        <input
          type="number"
          value={Number.isFinite(pattern.angleDeg) ? pattern.angleDeg : 0}
          disabled={!customAngle}
          step={1}
          onChange={(e) => patch({ angleDeg: Number(e.target.value) })}
          style={inputStyle(!customAngle)}
        />
      </label>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <LengthField
          label="Joint / gap"
          valueMm={pattern.jointMm}
          onCommit={(mm) => patch({ jointMm: Math.max(0, mm) })}
          placeholder="e.g. 3 mm"
        />
        <div />
        <LengthField
          label="Offset X"
          valueMm={pattern.offsetXmm}
          allowNegative
          onCommit={(mm) => patch({ offsetXmm: mm })}
        />
        <LengthField
          label="Offset Y"
          valueMm={pattern.offsetYmm}
          allowNegative
          onCommit={(mm) => patch({ offsetYmm: mm })}
        />
        <LengthField
          label="Row offset"
          valueMm={pattern.rowOffsetMm}
          disabled={rowOffsetTypeLocked}
          onCommit={(mm) => patch({ rowOffsetMm: Math.max(0, mm) })}
        />
        <label style={labelStyle(percentDisabled || rowOffsetTypeLocked)}>
          <span>Row offset %</span>
          <input
            type="number"
            min={0}
            max={100}
            step={1}
            value={Number.isFinite(pattern.rowOffsetPercent) ? pattern.rowOffsetPercent : 0}
            disabled={percentDisabled || rowOffsetTypeLocked}
            onChange={(e) =>
              patch({
                rowOffsetPercent: Math.max(0, Math.min(100, Number(e.target.value))),
              })
            }
            style={inputStyle(percentDisabled || rowOffsetTypeLocked)}
          />
          {percentDisabled && (
            <span style={{ fontSize: 11, color: 'var(--mlp-muted)' }}>
              Assign a material to use percent.
            </span>
          )}
        </label>
      </div>

      <div style={labelStyle()}>
        <span>Origin mode</span>
        <VisualOptionGrid minCardWidth={80}>
          {ORIGIN_META.map((opt) => (
            <VisualOption
              key={opt.value}
              label={opt.label}
              description={opt.description}
              selected={pattern.originMode === opt.value}
              onSelect={() => patch({ originMode: opt.value })}
            >
              <OriginPreview origin={opt.value} />
            </VisualOption>
          ))}
        </VisualOptionGrid>
      </div>

      {customOriginVisible && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <LengthField
            label="Origin X"
            valueMm={pattern.customOrigin?.x ?? 0}
            allowNegative
            onCommit={(mm) =>
              patch({ customOrigin: { x: mm, y: pattern.customOrigin?.y ?? 0 } })
            }
          />
          <LengthField
            label="Origin Y"
            valueMm={pattern.customOrigin?.y ?? 0}
            allowNegative
            onCommit={(mm) =>
              patch({ customOrigin: { x: pattern.customOrigin?.x ?? 0, y: mm } })
            }
          />
        </div>
      )}

      <div style={labelStyle()}>
        <span>Direction</span>
        <VisualOptionGrid minCardWidth={90}>
          {DIRECTION_META.map((opt) => (
            <VisualOption
              key={opt.value}
              label={opt.label}
              description={opt.description}
              selected={pattern.direction === opt.value}
              onSelect={() => patch({ direction: opt.value })}
            >
              <DirectionPreview direction={opt.value} />
            </VisualOption>
          ))}
        </VisualOptionGrid>
      </div>

      <div style={labelStyle()}>
        <span>Symmetry</span>
        <VisualOptionGrid minCardWidth={80}>
          {SYMMETRY_META.map((opt) => (
            <VisualOption
              key={opt.value}
              label={opt.label}
              description={opt.description}
              selected={pattern.symmetryMode === opt.value}
              onSelect={() => patch({ symmetryMode: opt.value })}
            >
              <SymmetryPreview symmetry={opt.value} />
            </VisualOption>
          ))}
        </VisualOptionGrid>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--mlp-border)', margin: '4px 0' }} />

      <OptimizationPanel value={pattern.optimizationPriority} onPatch={patchPriority} />
    </div>
  );
};
