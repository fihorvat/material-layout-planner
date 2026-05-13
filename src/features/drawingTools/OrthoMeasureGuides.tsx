import { useMemo } from 'react';
import { Group, Line as KLine, Text } from 'react-konva';
import type { Point2D } from '@/types';
import { useProjectStore } from '@/state';
import { formatLength } from '@/domain/units';
import { collectShapeEdges, type ShapeEdge } from './drawingMode';

export type OrthoMeasureGuide = {
  from: Point2D;
  to: Point2D;
  distanceMm: number;
  orientation: 'horizontal' | 'vertical';
};

const RAY_EPS = 1e-9;

// Returns the X coordinate where a horizontal ray at y = `y` crosses the
// given segment. Returns null when the segment does not span across that
// row, or when the segment is itself horizontal (infinitely many crossings
// degenerate the answer and are not useful for an ortho measure).
const horizontalCrossingX = (seg: ShapeEdge, y: number): number | null => {
  const { a, b } = seg;
  const dy = b.y - a.y;
  if (Math.abs(dy) < RAY_EPS) return null;
  if ((a.y - y) * (b.y - y) > RAY_EPS) return null;
  const t = (y - a.y) / dy;
  return a.x + t * (b.x - a.x);
};

// Mirror of horizontalCrossingX for vertical rays.
const verticalCrossingY = (seg: ShapeEdge, x: number): number | null => {
  const { a, b } = seg;
  const dx = b.x - a.x;
  if (Math.abs(dx) < RAY_EPS) return null;
  if ((a.x - x) * (b.x - x) > RAY_EPS) return null;
  const t = (x - a.x) / dx;
  return a.y + t * (b.y - a.y);
};

/**
 * For each cardinal direction (east, west, south, north) finds the nearest
 * shape edge that the cursor's row (horizontal rays) or column (vertical
 * rays) actually crosses, and returns the projected measurement guide from
 * the cursor to that real geometry point.
 *
 * Used while a drawing tool is active to surface live distances between the
 * cursor and surrounding shapes so the user can place vertices/edges with a
 * known offset. Unlike a bbox-based version this projects onto the true
 * shape outline, so rotated rectangles and arbitrary polygons report the
 * correct distance.
 */
export const computeOrthoMeasureGuides = (
  cursor: Point2D,
  edges: readonly ShapeEdge[],
): OrthoMeasureGuide[] => {
  let east: number | null = null;
  let west: number | null = null;
  let south: number | null = null;
  let north: number | null = null;
  for (const seg of edges) {
    const hX = horizontalCrossingX(seg, cursor.y);
    if (hX !== null) {
      if (hX > cursor.x + RAY_EPS && (east === null || hX < east)) east = hX;
      if (hX < cursor.x - RAY_EPS && (west === null || hX > west)) west = hX;
    }
    const vY = verticalCrossingY(seg, cursor.x);
    if (vY !== null) {
      if (vY > cursor.y + RAY_EPS && (south === null || vY < south)) south = vY;
      if (vY < cursor.y - RAY_EPS && (north === null || vY > north)) north = vY;
    }
  }
  const guides: OrthoMeasureGuide[] = [];
  if (east !== null) {
    guides.push({
      from: cursor,
      to: { x: east, y: cursor.y },
      distanceMm: east - cursor.x,
      orientation: 'horizontal',
    });
  }
  if (west !== null) {
    guides.push({
      from: cursor,
      to: { x: west, y: cursor.y },
      distanceMm: cursor.x - west,
      orientation: 'horizontal',
    });
  }
  if (south !== null) {
    guides.push({
      from: cursor,
      to: { x: cursor.x, y: south },
      distanceMm: south - cursor.y,
      orientation: 'vertical',
    });
  }
  if (north !== null) {
    guides.push({
      from: cursor,
      to: { x: cursor.x, y: north },
      distanceMm: cursor.y - north,
      orientation: 'vertical',
    });
  }
  return guides;
};

const GUIDE_COLOR = '#22c55e';
const LABEL_COLOR = '#15803d';
const MIN_DISTANCE_MM = 0.5;

export const OrthoMeasureGuides = ({ cursor }: { cursor: Point2D }) => {
  const project = useProjectStore((s) => s.project);
  const edges = useMemo(() => collectShapeEdges(project), [project]);
  const guides = useMemo(
    () => computeOrthoMeasureGuides(cursor, edges).filter((g) => g.distanceMm >= MIN_DISTANCE_MM),
    [cursor, edges],
  );
  if (guides.length === 0) return null;
  return (
    <Group listening={false}>
      {guides.map((g, i) => {
        const midX = (g.from.x + g.to.x) / 2;
        const midY = (g.from.y + g.to.y) / 2;
        return (
          <Group key={i}>
            <KLine
              points={[g.from.x, g.from.y, g.to.x, g.to.y]}
              stroke={GUIDE_COLOR}
              strokeWidth={1}
              strokeScaleEnabled={false}
              dash={[4, 3]}
              dashEnabled
              opacity={0.9}
            />
            <Text
              x={midX}
              y={midY}
              text={formatLength(g.distanceMm)}
              fontSize={10}
              fill={LABEL_COLOR}
              offsetY={g.orientation === 'horizontal' ? 12 : 0}
              offsetX={g.orientation === 'vertical' ? -6 : 0}
            />
          </Group>
        );
      })}
    </Group>
  );
};
