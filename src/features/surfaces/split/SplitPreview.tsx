import { Group, Line as KLine, Circle, Rect, Text } from 'react-konva';
import type { Point2D, Surface } from '@/types';
import { surfaceEdges } from '@/domain/surfaces/surfaceGeometry';
import { useEditorStore, useSplitToolStore } from '@/state';
import { formatLength } from '@/domain/units';
import type { SplitDrawState } from './useSplitSurfaceDraw';

const flat = (pts: Point2D[]): number[] => {
  const out: number[] = [];
  for (const p of pts) out.push(p.x, p.y);
  return out;
};

type SplitPreviewProps = {
  state: SplitDrawState;
  surface: Surface | null;
};

const HIGHLIGHT = '#2563eb';
const HIGHLIGHT_DASH = '#a855f7';

export const SplitPreview = ({ state, surface }: SplitPreviewProps) => {
  const scale = useEditorStore((s) => s.viewport.scale);
  const dimensionPending = useSplitToolStore((s) => s.dimensionPending);

  const nodes: React.ReactNode[] = [];

  // Highlight the targeted surface outline.
  if (surface) {
    nodes.push(
      <KLine
        key="target"
        points={flat(surface.outerBoundary)}
        closed
        stroke={HIGHLIGHT}
        strokeWidth={2}
        strokeScaleEnabled={false}
        dash={[4, 4]}
        dashEnabled
        listening={false}
      />,
    );

    // In dimension mode, highlight edges on hover for selection.
    if (state.phase === 'dimPickEdge') {
      for (const e of surfaceEdges(surface)) {
        const selected =
          dimensionPending &&
          dimensionPending.surfaceId === surface.id &&
          dimensionPending.edgeIndex === e.index;
        nodes.push(
          <KLine
            key={`edge:${e.index}`}
            points={[e.a.x, e.a.y, e.b.x, e.b.y]}
            stroke={selected ? '#dc2626' : HIGHLIGHT}
            strokeWidth={selected ? 3 : 2}
            strokeScaleEnabled={false}
            listening={false}
          />,
        );
      }
    }
  }

  if (state.phase === 'linePickB') {
    nodes.push(
      <KLine
        key="rubber"
        points={[state.first.x, state.first.y, state.cursor.x, state.cursor.y]}
        stroke={state.ortho ? '#f59e0b' : HIGHLIGHT}
        strokeWidth={1.5}
        strokeScaleEnabled={false}
        dash={[6, 4]}
        dashEnabled
        listening={false}
      />,
    );
    nodes.push(
      <Circle key="first" x={state.first.x} y={state.first.y} radius={3} fill={HIGHLIGHT} listening={false} />,
    );
  } else if (state.phase === 'rectPickB') {
    const f = state.first;
    const c = state.cursor;
    const minX = Math.min(f.x, c.x);
    const minY = Math.min(f.y, c.y);
    const w = Math.abs(c.x - f.x);
    const h = Math.abs(c.y - f.y);
    nodes.push(
      <Rect
        key="rect"
        x={minX}
        y={minY}
        width={w}
        height={h}
        stroke={HIGHLIGHT}
        strokeWidth={1.5}
        strokeScaleEnabled={false}
        dash={[6, 4]}
        dashEnabled
        fill="rgba(37,99,235,0.08)"
        listening={false}
      />,
    );
    nodes.push(
      <Text
        key="label"
        x={(f.x + c.x) / 2}
        y={(f.y + c.y) / 2}
        text={`${formatLength(w)} \u00D7 ${formatLength(h)}`}
        fontSize={11}
        fill="#1f2937"
        listening={false}
      />,
    );
  } else if (state.phase === 'polyDrawing') {
    const last = state.points[state.points.length - 1]!;
    nodes.push(
      <KLine
        key="poly"
        points={flat(state.points)}
        stroke={HIGHLIGHT}
        strokeWidth={1.5}
        strokeScaleEnabled={false}
        listening={false}
      />,
    );
    nodes.push(
      <KLine
        key="poly-rubber"
        points={[last.x, last.y, state.cursor.x, state.cursor.y]}
        stroke={HIGHLIGHT_DASH}
        strokeWidth={1.25}
        strokeScaleEnabled={false}
        dash={[6, 4]}
        dashEnabled
        listening={false}
      />,
    );
    for (let i = 0; i < state.points.length; i++) {
      const p = state.points[i]!;
      nodes.push(<Circle key={`v:${i}`} x={p.x} y={p.y} radius={3} fill={HIGHLIGHT} listening={false} />);
    }
  }

  // Scale-aware help text could be added; keep overlay minimal.
  void scale;

  return <Group listening={false}>{nodes}</Group>;
};
