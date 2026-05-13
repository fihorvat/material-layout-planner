import type { OptimizationPriority } from '@/types';

export type OptimizationPanelProps = {
  value: OptimizationPriority;
  onPatch: (patch: Partial<OptimizationPriority>) => void;
};

type Weight = 1 | 2 | 4;
type JointWeight = 0 | 1 | 2;

const WEIGHT_LABEL: Record<Weight, string> = { 1: 'Low', 2: 'Medium', 4: 'High' };
const JOINT_LABEL: Record<JointWeight, string> = {
  0: 'Off',
  1: 'Selected surfaces',
  2: 'Connected group',
};

const toWeight = (n: number): Weight => (n >= 4 ? 4 : n >= 2 ? 2 : 1);
const toJoint = (n: number): JointWeight => (n >= 2 ? 2 : n >= 1 ? 1 : 0);

const PriorityRow = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Weight;
  onChange: (w: Weight) => void;
}) => (
  <label style={{ display: 'grid', gridTemplateColumns: '120px 1fr 60px', alignItems: 'center', gap: 8 }}>
    <span style={{ fontSize: 12, color: 'var(--mlp-muted)' }}>{label}</span>
    <input
      type="range"
      min={1}
      max={4}
      step={1}
      value={value}
      onChange={(e) => {
        const next = Number(e.target.value);
        onChange(next >= 3 ? 4 : (next as Weight));
      }}
      list={`opt-${label}`}
    />
    <span style={{ fontSize: 12, color: 'var(--mlp-muted)', textAlign: 'right' }}>{WEIGHT_LABEL[value]}</span>
  </label>
);

export const OptimizationPanel = ({ value, onPatch }: OptimizationPanelProps) => {
  const waste = toWeight(value.wasteWeight);
  const symmetry = toWeight(value.symmetryWeight);
  const cutCount = toWeight(value.cutCountWeight);
  const smallPiece = toWeight(value.smallPieceWeight);
  const joint = toJoint(value.jointAlignmentWeight);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <strong style={{ fontSize: 12, color: 'var(--mlp-text)' }}>Optimization priorities</strong>
      <PriorityRow label="Waste" value={waste} onChange={(w) => onPatch({ wasteWeight: w })} />
      <PriorityRow
        label="Symmetry"
        value={symmetry}
        onChange={(w) => onPatch({ symmetryWeight: w })}
      />
      <PriorityRow
        label="Cut count"
        value={cutCount}
        onChange={(w) => onPatch({ cutCountWeight: w })}
      />
      <PriorityRow
        label="Small pieces"
        value={smallPiece}
        onChange={(w) => onPatch({ smallPieceWeight: w })}
      />

      <label
        style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: 8 }}
      >
        <span style={{ fontSize: 12, color: 'var(--mlp-muted)' }}>Joint alignment</span>
        <select
          value={joint}
          onChange={(e) => onPatch({ jointAlignmentWeight: Number(e.target.value) })}
          style={{
            padding: '4px 6px',
            background: 'var(--mlp-bg)',
            color: 'var(--mlp-text)',
            border: '1px solid var(--mlp-border-strong)',
            borderRadius: 4,
            fontSize: 13,
          }}
        >
          {(Object.entries(JOINT_LABEL) as [string, string][]).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label
        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--mlp-muted)' }}
      >
        <input
          type="checkbox"
          checked={value.manualOffsetLocked}
          onChange={(e) => onPatch({ manualOffsetLocked: e.target.checked })}
        />
        Lock manual offset (don&apos;t auto-optimize offsets)
      </label>
    </div>
  );
};
