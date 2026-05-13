import { useMemo } from 'react';
import { Group, Line as KLine, Text } from 'react-konva';
import type { Point2D } from '@/types';
import { useProjectStore } from '@/state';
import { formatLength } from '@/domain/units';
import { collectShapeBoundingBoxes, type IdentifiedBbox } from './drawingMode';

export type OrthoMeasureGuide = {
  from: Point2D;
  to: Point2D;
  distanceMm: number;
  orientation: 'horizontal' | 'vertical';
};

/**
 * For each cardinal direction (east, west, south, north) finds the nearest
 * shape bounding-rectangle whose extent crosses the cursor's row (for
 * horizontal rays) or column (for vertical rays) and returns the projected
 * measurement guide from the cursor to that bbox edge.
 *
 * Used while a drawing tool is active to surface live distances between the
 * cursor and surrounding shapes so the user can place vertices/edges with a
 * known offset.
 */
export const computeOrthoMeasureGuides = (
  cursor: Point2D,
  bboxes: readonly IdentifiedBbox[],
): OrthoMeasureGuide[] => {
  let east: number | null = null;
  let west: number | null = null;
  let south: number | null = null;
  let north: number | null = null;
  for (const { bbox } of bboxes) {
    if (cursor.y >= bbox.minY && cursor.y <= bbox.maxY) {
      if (bbox.minX > cursor.x && (east === null || bbox.minX < east)) {
        east = bbox.minX;
      }
      if (bbox.maxX < cursor.x && (west === null || bbox.maxX > west)) {
        west = bbox.maxX;
      }
    }
    if (cursor.x >= bbox.minX && cursor.x <= bbox.maxX) {
      if (bbox.minY > cursor.y && (south === null || bbox.minY < south)) {
        south = bbox.minY;
      }
      if (bbox.maxY < cursor.y && (north === null || bbox.maxY > north)) {
        north = bbox.maxY;
      }
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
  const bboxes = useMemo(() => collectShapeBoundingBoxes(project), [project]);
  const guides = useMemo(
    () => computeOrthoMeasureGuides(cursor, bboxes).filter((g) => g.distanceMm >= MIN_DISTANCE_MM),
    [cursor, bboxes],
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
