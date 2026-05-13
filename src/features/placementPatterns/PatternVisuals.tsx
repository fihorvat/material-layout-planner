import type { ReactNode } from 'react';
import type { PlacementPattern } from '@/types';
import { Tooltip } from '@/components';

// ---------- Reusable visual option card + grid ----------

export type VisualOptionProps = {
  label: string;
  description: string;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
  children: ReactNode;
};

/** Clickable card with an SVG preview and a tooltip explanation. */
export const VisualOption = ({
  label,
  description,
  selected,
  disabled,
  onSelect,
  children,
}: VisualOptionProps) => (
  <Tooltip label={description}>
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={`${label}. ${description}`}
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        padding: 6,
        border: `2px solid ${
          selected ? 'var(--mlp-accent)' : 'var(--mlp-border-strong)'
        }`,
        background: selected ? 'var(--mlp-accent-soft)' : 'var(--mlp-surface)',
        color: 'var(--mlp-text)',
        borderRadius: 6,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {children}
      <span style={{ fontSize: 11, fontWeight: selected ? 600 : 400, textAlign: 'center' }}>
        {label}
      </span>
    </button>
  </Tooltip>
);

export type VisualOptionGridProps = {
  minCardWidth?: number;
  children: ReactNode;
};

export const VisualOptionGrid = ({ minCardWidth = 80, children }: VisualOptionGridProps) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: `repeat(auto-fill, minmax(${minCardWidth}px, 1fr))`,
      gap: 6,
    }}
  >
    {children}
  </div>
);

// ---------- Shared SVG helpers ----------

const PREVIEW_W = 80;
const PREVIEW_H = 46;
const BRICK_FILL = 'var(--mlp-accent-soft, #dbeafe)';
const BRICK_STROKE = 'var(--mlp-accent, #2563eb)';
const SURFACE_BG = 'var(--mlp-surface-2, #f1f5f9)';
const SURFACE_STROKE = 'var(--mlp-border-strong, #94a3b8)';
const MUTED_STROKE = 'var(--mlp-muted, #6b7280)';
const ACCENT_STROKE = 'var(--mlp-accent, #2563eb)';

const Frame = ({ children }: { children: ReactNode }) => (
  <svg
    width={PREVIEW_W}
    height={PREVIEW_H}
    viewBox={`0 0 ${PREVIEW_W} ${PREVIEW_H}`}
    style={{ display: 'block', borderRadius: 3, background: SURFACE_BG }}
    aria-hidden
  >
    {children}
  </svg>
);

/** Lay out a running-bond grid filling the preview frame. */
const buildBricks = (
  brickW: number,
  brickH: number,
  rowOffsetFrac: number,
  rotation = 0,
): { x: number; y: number }[] => {
  const gap = 1.2;
  const stepX = brickW + gap;
  const stepY = brickH + gap;
  const rows = Math.ceil(PREVIEW_H / stepY) + 2;
  const cols = Math.ceil(PREVIEW_W / stepX) + 3;
  const rects: { x: number; y: number }[] = [];
  const offsetPx = stepX * rowOffsetFrac;
  for (let r = -1; r < rows; r++) {
    const xShift = (r % 2 === 0 ? 0 : offsetPx) - stepX;
    for (let c = -1; c < cols; c++) {
      rects.push({ x: c * stepX + xShift, y: r * stepY });
    }
  }
  // Rotation handled by parent <g transform>; just return rects.
  void rotation;
  return rects;
};

const BrickGrid = ({
  brickW,
  brickH,
  rowOffsetFrac,
  rotation = 0,
}: {
  brickW: number;
  brickH: number;
  rowOffsetFrac: number;
  rotation?: number;
}) => {
  const bricks = buildBricks(brickW, brickH, rowOffsetFrac);
  const clipId = `clip-${brickW}-${brickH}-${rowOffsetFrac}-${rotation}`;
  return (
    <>
      <clipPath id={clipId}>
        <rect x={0} y={0} width={PREVIEW_W} height={PREVIEW_H} />
      </clipPath>
      <g
        clipPath={`url(#${clipId})`}
        transform={
          rotation
            ? `rotate(${rotation} ${PREVIEW_W / 2} ${PREVIEW_H / 2})`
            : undefined
        }
      >
        {bricks.map((b, i) => (
          <rect
            key={i}
            x={b.x}
            y={b.y}
            width={brickW}
            height={brickH}
            fill={BRICK_FILL}
            stroke={BRICK_STROKE}
            strokeWidth={0.8}
          />
        ))}
      </g>
    </>
  );
};

// ---------- Type previews ----------

export const TypePreview = ({ type }: { type: PlacementPattern['type'] }) => {
  switch (type) {
    case 'stacked':
      return (
        <Frame>
          <BrickGrid brickW={18} brickH={9} rowOffsetFrac={0} />
        </Frame>
      );
    case 'verticalStacked':
      return (
        <Frame>
          <BrickGrid brickW={9} brickH={18} rowOffsetFrac={0} />
        </Frame>
      );
    case 'runningBondHalf':
      return (
        <Frame>
          <BrickGrid brickW={18} brickH={9} rowOffsetFrac={0.5} />
        </Frame>
      );
    case 'runningBondThird':
      return (
        <Frame>
          <BrickGrid brickW={18} brickH={9} rowOffsetFrac={1 / 3} />
        </Frame>
      );
    case 'customOffset':
      return (
        <Frame>
          <BrickGrid brickW={18} brickH={9} rowOffsetFrac={0.22} />
          <text
            x={PREVIEW_W - 4}
            y={PREVIEW_H - 4}
            textAnchor="end"
            fontSize={9}
            fontWeight={700}
            fill={ACCENT_STROKE}
          >
            ?
          </text>
        </Frame>
      );
    case 'diagonal':
      return (
        <Frame>
          <BrickGrid brickW={16} brickH={8} rowOffsetFrac={0.5} rotation={45} />
        </Frame>
      );
  }
};

// ---------- Orientation previews ----------

export const OrientationPreview = ({
  orientation,
}: {
  orientation: PlacementPattern['orientation'];
}) => {
  if (orientation === 'customAngle') {
    return (
      <Frame>
        <BrickGrid brickW={18} brickH={9} rowOffsetFrac={0.5} rotation={20} />
        <path
          d={`M ${PREVIEW_W / 2 - 14} ${PREVIEW_H / 2} A 14 14 0 0 1 ${
            PREVIEW_W / 2 - 14 + 14 * Math.cos((20 * Math.PI) / 180)
          } ${PREVIEW_H / 2 + 14 * Math.sin((20 * Math.PI) / 180)}`}
          stroke={ACCENT_STROKE}
          strokeWidth={1}
          fill="none"
        />
      </Frame>
    );
  }
  const brickW = orientation === 'horizontal' ? 18 : 9;
  const brickH = orientation === 'horizontal' ? 9 : 18;
  return (
    <Frame>
      <BrickGrid brickW={brickW} brickH={brickH} rowOffsetFrac={0.5} />
    </Frame>
  );
};

// ---------- Origin previews ----------

export const OriginPreview = ({ origin }: { origin: PlacementPattern['originMode'] }) => {
  // Inset surface rectangle.
  const inset = 8;
  const x1 = inset;
  const y1 = inset;
  const x2 = PREVIEW_W - inset;
  const y2 = PREVIEW_H - inset;
  let px = (x1 + x2) / 2;
  let py = (y1 + y2) / 2;
  if (origin === 'topLeft') {
    px = x1;
    py = y1;
  } else if (origin === 'bottomLeft') {
    px = x1;
    py = y2;
  } else if (origin === 'customPoint') {
    px = x1 + (x2 - x1) * 0.7;
    py = y1 + (y2 - y1) * 0.35;
  }
  return (
    <Frame>
      <rect
        x={x1}
        y={y1}
        width={x2 - x1}
        height={y2 - y1}
        fill="none"
        stroke={SURFACE_STROKE}
        strokeWidth={1}
      />
      {origin === 'customPoint' && (
        <g stroke={ACCENT_STROKE} strokeWidth={0.8}>
          <line x1={px - 4} y1={py} x2={px + 4} y2={py} />
          <line x1={px} y1={py - 4} x2={px} y2={py + 4} />
        </g>
      )}
      <circle cx={px} cy={py} r={3} fill={ACCENT_STROKE} />
    </Frame>
  );
};

// ---------- Direction previews ----------

export const DirectionPreview = ({
  direction,
}: {
  direction: PlacementPattern['direction'];
}) => {
  const inset = 8;
  const cx = PREVIEW_W / 2;
  const cy = PREVIEW_H / 2;
  let x1 = cx - 16;
  let y1 = cy;
  let x2 = cx + 16;
  let y2 = cy;
  if (direction === 'rightToLeft') {
    x1 = cx + 16;
    x2 = cx - 16;
  } else if (direction === 'topToBottom') {
    x1 = cx;
    y1 = cy - 12;
    x2 = cx;
    y2 = cy + 12;
  } else if (direction === 'bottomToTop') {
    x1 = cx;
    y1 = cy + 12;
    x2 = cx;
    y2 = cy - 12;
  }
  return (
    <Frame>
      <rect
        x={inset}
        y={inset}
        width={PREVIEW_W - inset * 2}
        height={PREVIEW_H - inset * 2}
        fill="none"
        stroke={SURFACE_STROKE}
        strokeWidth={1}
      />
      <defs>
        <marker
          id={`arrow-${direction}`}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={ACCENT_STROKE} />
        </marker>
      </defs>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={ACCENT_STROKE}
        strokeWidth={2}
        markerEnd={`url(#arrow-${direction})`}
      />
    </Frame>
  );
};

// ---------- Symmetry previews ----------

export const SymmetryPreview = ({
  symmetry,
}: {
  symmetry: PlacementPattern['symmetryMode'];
}) => {
  const inset = 8;
  return (
    <Frame>
      <BrickGrid brickW={14} brickH={7} rowOffsetFrac={0.5} />
      <rect
        x={inset}
        y={inset}
        width={PREVIEW_W - inset * 2}
        height={PREVIEW_H - inset * 2}
        fill="none"
        stroke={SURFACE_STROKE}
        strokeWidth={0.5}
        opacity={0.5}
      />
      {symmetry === 'verticalAxis' && (
        <line
          x1={PREVIEW_W / 2}
          y1={2}
          x2={PREVIEW_W / 2}
          y2={PREVIEW_H - 2}
          stroke={MUTED_STROKE}
          strokeWidth={1.2}
          strokeDasharray="3 2"
        />
      )}
      {symmetry === 'horizontalAxis' && (
        <line
          x1={2}
          y1={PREVIEW_H / 2}
          x2={PREVIEW_W - 2}
          y2={PREVIEW_H / 2}
          stroke={MUTED_STROKE}
          strokeWidth={1.2}
          strokeDasharray="3 2"
        />
      )}
      {symmetry === 'customAxis' && (
        <line
          x1={6}
          y1={PREVIEW_H - 4}
          x2={PREVIEW_W - 6}
          y2={4}
          stroke={MUTED_STROKE}
          strokeWidth={1.2}
          strokeDasharray="3 2"
        />
      )}
    </Frame>
  );
};

// ---------- Option metadata (label + description) ----------

export const TYPE_META: {
  value: PlacementPattern['type'];
  label: string;
  description: string;
}[] = [
  {
    value: 'stacked',
    label: 'Stacked',
    description: 'Aligned grid — no row offset, all joints line up.',
  },
  {
    value: 'verticalStacked',
    label: 'Vertical',
    description: 'Tall units stacked aligned in columns (no offset).',
  },
  {
    value: 'runningBondHalf',
    label: 'Bond 1/2',
    description: 'Running bond — each row offset by 50% of the unit width.',
  },
  {
    value: 'runningBondThird',
    label: 'Bond 1/3',
    description: 'Running bond — each row offset by 33% of the unit width.',
  },
  {
    value: 'customOffset',
    label: 'Custom offset',
    description: 'Specify a custom row offset (in mm or % of unit width).',
  },
  {
    value: 'diagonal',
    label: 'Diagonal',
    description: 'Units rotated 45° forming a diagonal layout.',
  },
];

export const ORIENTATION_META: {
  value: PlacementPattern['orientation'];
  label: string;
  description: string;
}[] = [
  {
    value: 'horizontal',
    label: 'Horizontal',
    description: 'Units placed with their long side running horizontally.',
  },
  {
    value: 'vertical',
    label: 'Vertical',
    description: 'Units placed with their long side running vertically.',
  },
  {
    value: 'customAngle',
    label: 'Custom angle',
    description: 'Rotate units by a user-defined angle (degrees).',
  },
];

export const ORIGIN_META: {
  value: PlacementPattern['originMode'];
  label: string;
  description: string;
}[] = [
  {
    value: 'surfaceCenter',
    label: 'Center',
    description: 'Pattern is centered on the surface — symmetric edges.',
  },
  {
    value: 'topLeft',
    label: 'Top-left',
    description: 'Pattern starts from the top-left corner of the surface.',
  },
  {
    value: 'bottomLeft',
    label: 'Bottom-left',
    description: 'Pattern starts from the bottom-left corner of the surface.',
  },
  {
    value: 'customPoint',
    label: 'Custom',
    description: 'Specify exact X / Y coordinates where the pattern starts.',
  },
];

export const DIRECTION_META: {
  value: PlacementPattern['direction'];
  label: string;
  description: string;
}[] = [
  {
    value: 'leftToRight',
    label: 'Left → Right',
    description: 'Layout grows from left to right.',
  },
  {
    value: 'rightToLeft',
    label: 'Right → Left',
    description: 'Layout grows from right to left.',
  },
  {
    value: 'topToBottom',
    label: 'Top → Bottom',
    description: 'Layout grows from top to bottom.',
  },
  {
    value: 'bottomToTop',
    label: 'Bottom → Top',
    description: 'Layout grows from bottom to top.',
  },
];

export const SYMMETRY_META: {
  value: PlacementPattern['symmetryMode'];
  label: string;
  description: string;
}[] = [
  {
    value: 'none',
    label: 'None',
    description: 'No symmetry — pattern fills naturally from origin and direction.',
  },
  {
    value: 'verticalAxis',
    label: 'Vertical',
    description: 'Mirror around the vertical center axis (left ↔ right).',
  },
  {
    value: 'horizontalAxis',
    label: 'Horizontal',
    description: 'Mirror around the horizontal center axis (top ↔ bottom).',
  },
  {
    value: 'customAxis',
    label: 'Custom',
    description: 'Mirror around a user-defined axis.',
  },
];
