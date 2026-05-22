import type { ReactNode } from 'react';
import type { SurfaceConnection } from '@/types';
import { Tooltip } from '@/components';
export {
  createConnectionDefaults,
  getConnectionTypeDefaults,
  inferConnectionMaterialThicknessMm,
} from './connectionDefaults';

type ConnectionTypeMeta = {
  id: SurfaceConnection['connectionType'];
  label: string;
  description: string;
};

type ThicknessModeMeta = {
  id: SurfaceConnection['thicknessMode'];
  label: string;
  description: string;
};

export const CONNECTION_TYPE_META: ConnectionTypeMeta[] = [
  {
    id: 'outsideCorner',
    label: 'Outside corner',
    description: 'Two faces wrap around an outer corner. Use this for external folds or returns.',
  },
  {
    id: 'insideCorner',
    label: 'Inside corner',
    description: 'Two faces meet inside a corner, like the inside of a niche or box.',
  },
  {
    id: 'flatContinuation',
    label: 'Flat continuation',
    description: 'Both faces stay in the same plane with a shared seam along the connection.',
  },
  {
    id: 'buttJoint',
    label: 'Butt joint',
    description: 'One face terminates into another face. The recommended preset turns on overlap and thickness compensation.',
  },
  {
    id: 'custom',
    label: 'Custom',
    description: 'Start from a neutral setup and tune the seam, overlap, and angle manually.',
  },
];

export const THICKNESS_MODE_META: ThicknessModeMeta[] = [
  {
    id: 'ignoreThickness',
    label: 'Ignore thickness',
    description: 'Treat the connection as a simple edge-to-edge relationship with no thickness compensation.',
  },
  {
    id: 'showThicknessOnly',
    label: 'Show thickness only',
    description: 'Display the material thickness at the connection without offsetting the covered edge.',
  },
  {
    id: 'compensateCoveredEdge',
    label: 'Compensate covered edge',
    description: 'Shift the covered side by the material thickness so the connection matches a physical wrap or lap.',
  },
  {
    id: 'customAllowance',
    label: 'Custom allowance',
    description: 'Reserve space for a future custom offset value. The preview shows a manual allowance zone.',
  },
];

const PREVIEW_W = 88;
const PREVIEW_H = 54;
const FRAME_FILL = 'var(--mlp-surface-2, #f8fafc)';
const FRAME_STROKE = 'var(--mlp-border-strong, #94a3b8)';
const FACE_FILL = '#dbeafe';
const FACE_STROKE = '#2563eb';
const SEAM_STROKE = '#334155';
const OVERLAP_FILL = '#fdba74';
const OVERLAP_STROKE = '#ea580c';
const THICKNESS_FILL = '#bfdbfe';
const THICKNESS_STROKE = '#1d4ed8';

type ConnectionVisualOptionProps = {
  label: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
  children: ReactNode;
};

export const ConnectionVisualOption = ({
  label,
  description,
  selected,
  onSelect,
  children,
}: ConnectionVisualOptionProps) => (
  <Tooltip label={description}>
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`${label}. ${description}`}
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        padding: 8,
        border: `2px solid ${selected ? 'var(--mlp-accent)' : 'var(--mlp-border-strong)'}`,
        background: selected ? 'var(--mlp-accent-soft)' : 'var(--mlp-surface)',
        color: 'var(--mlp-text)',
        borderRadius: 8,
        cursor: 'pointer',
      }}
    >
      {children}
      <span style={{ fontSize: 11, fontWeight: selected ? 600 : 500, textAlign: 'center' }}>
        {label}
      </span>
    </button>
  </Tooltip>
);

export const ConnectionVisualGrid = ({
  minCardWidth = 100,
  children,
}: {
  minCardWidth?: number;
  children: ReactNode;
}) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: `repeat(auto-fill, minmax(${minCardWidth}px, 1fr))`,
      gap: 8,
    }}
  >
    {children}
  </div>
);

const Frame = ({ children }: { children: ReactNode }) => (
  <svg
    width={PREVIEW_W}
    height={PREVIEW_H}
    viewBox={`0 0 ${PREVIEW_W} ${PREVIEW_H}`}
    style={{ display: 'block', borderRadius: 4, background: FRAME_FILL }}
    aria-hidden
  >
    <rect
      x={1}
      y={1}
      width={PREVIEW_W - 2}
      height={PREVIEW_H - 2}
      rx={7}
      fill={FRAME_FILL}
      stroke={FRAME_STROKE}
      strokeWidth={1.5}
    />
    {children}
  </svg>
);

export const ConnectionTypePreview = ({
  type,
}: {
  type: SurfaceConnection['connectionType'];
}) => {
  switch (type) {
    case 'outsideCorner':
      return (
        <Frame>
          <path d="M 20 12 H 54 V 24 H 32 V 42 H 20 Z" fill={FACE_FILL} stroke={FACE_STROKE} strokeWidth={2} />
          <path d="M 54 12 H 68 V 42 H 56 V 24 H 54 Z" fill={THICKNESS_FILL} stroke={THICKNESS_STROKE} strokeWidth={2} />
          <path d="M 54 12 V 42" stroke={SEAM_STROKE} strokeWidth={2} strokeDasharray="4 3" />
        </Frame>
      );
    case 'insideCorner':
      return (
        <Frame>
          <path d="M 20 12 H 66 V 24 H 32 V 42 H 20 Z" fill={FACE_FILL} stroke={FACE_STROKE} strokeWidth={2} />
          <path d="M 32 24 H 44 V 42 H 32 Z" fill={THICKNESS_FILL} stroke={THICKNESS_STROKE} strokeWidth={2} />
          <path d="M 32 24 H 44 V 42" stroke={SEAM_STROKE} strokeWidth={2} strokeDasharray="4 3" fill="none" />
        </Frame>
      );
    case 'flatContinuation':
      return (
        <Frame>
          <rect x={12} y={18} width={28} height={18} fill={FACE_FILL} stroke={FACE_STROKE} strokeWidth={2} rx={3} />
          <rect x={48} y={18} width={28} height={18} fill={FACE_FILL} stroke={FACE_STROKE} strokeWidth={2} rx={3} />
          <line x1={44} y1={14} x2={44} y2={40} stroke={SEAM_STROKE} strokeWidth={2} strokeDasharray="4 3" />
        </Frame>
      );
    case 'buttJoint':
      return (
        <Frame>
          <rect x={16} y={14} width={20} height={26} fill={FACE_FILL} stroke={FACE_STROKE} strokeWidth={2} rx={3} />
          <rect x={34} y={20} width={30} height={14} fill={THICKNESS_FILL} stroke={THICKNESS_STROKE} strokeWidth={2} rx={3} />
          <rect x={36} y={20} width={8} height={14} fill={OVERLAP_FILL} stroke={OVERLAP_STROKE} strokeWidth={2} rx={2} />
          <line x1={34} y1={16} x2={34} y2={38} stroke={SEAM_STROKE} strokeWidth={2} strokeDasharray="4 3" />
        </Frame>
      );
    case 'custom':
      return (
        <Frame>
          <path d="M 16 34 L 34 18 L 54 24 L 70 14" fill="none" stroke={FACE_STROKE} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 34 18 A 18 18 0 0 1 52 26" fill="none" stroke={OVERLAP_STROKE} strokeWidth={2} />
          <text x={58} y={39} textAnchor="middle" fontSize={14} fontWeight={700} fill={SEAM_STROKE}>?</text>
        </Frame>
      );
  }
};

export const ThicknessModePreview = ({
  mode,
}: {
  mode: SurfaceConnection['thicknessMode'];
}) => {
  switch (mode) {
    case 'ignoreThickness':
      return (
        <Frame>
          <rect x={14} y={18} width={24} height={18} fill={FACE_FILL} stroke={FACE_STROKE} strokeWidth={2} rx={3} />
          <rect x={48} y={18} width={24} height={18} fill={FACE_FILL} stroke={FACE_STROKE} strokeWidth={2} rx={3} />
          <line x1={43} y1={14} x2={43} y2={40} stroke={SEAM_STROKE} strokeWidth={2} strokeDasharray="4 3" />
        </Frame>
      );
    case 'showThicknessOnly':
      return (
        <Frame>
          <rect x={14} y={18} width={24} height={18} fill={FACE_FILL} stroke={FACE_STROKE} strokeWidth={2} rx={3} />
          <rect x={48} y={18} width={24} height={18} fill={FACE_FILL} stroke={FACE_STROKE} strokeWidth={2} rx={3} />
          <rect x={38} y={16} width={8} height={22} fill={THICKNESS_FILL} stroke={THICKNESS_STROKE} strokeWidth={2} rx={2} />
        </Frame>
      );
    case 'compensateCoveredEdge':
      return (
        <Frame>
          <rect x={14} y={18} width={24} height={18} fill={FACE_FILL} stroke={FACE_STROKE} strokeWidth={2} rx={3} />
          <rect x={46} y={18} width={24} height={18} fill={FACE_FILL} stroke={FACE_STROKE} strokeWidth={2} rx={3} />
          <rect x={38} y={18} width={10} height={18} fill={OVERLAP_FILL} stroke={OVERLAP_STROKE} strokeWidth={2} rx={2} />
          <path d="M 32 10 H 54" stroke={SEAM_STROKE} strokeWidth={2} />
          <path d="M 32 10 L 36 7" stroke={SEAM_STROKE} strokeWidth={2} />
          <path d="M 32 10 L 36 13" stroke={SEAM_STROKE} strokeWidth={2} />
          <path d="M 54 10 L 50 7" stroke={SEAM_STROKE} strokeWidth={2} />
          <path d="M 54 10 L 50 13" stroke={SEAM_STROKE} strokeWidth={2} />
        </Frame>
      );
    case 'customAllowance':
      return (
        <Frame>
          <rect x={14} y={18} width={24} height={18} fill={FACE_FILL} stroke={FACE_STROKE} strokeWidth={2} rx={3} />
          <rect x={46} y={18} width={24} height={18} fill={FACE_FILL} stroke={FACE_STROKE} strokeWidth={2} rx={3} />
          <rect x={38} y={16} width={10} height={22} fill={OVERLAP_FILL} stroke={OVERLAP_STROKE} strokeWidth={2} rx={2} opacity={0.75} />
          <text x={43} y={14} textAnchor="middle" fontSize={10} fontWeight={700} fill={SEAM_STROKE}>x</text>
        </Frame>
      );
  }
};