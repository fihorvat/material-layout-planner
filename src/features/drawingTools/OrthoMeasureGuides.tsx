import { useMemo } from 'react';
import { Group, Line as KLine, Text } from 'react-konva';
import type { Point2D } from '@/types';
import { useProjectStore } from '@/state';
import { formatLength } from '@/domain/units';
import { collectShapeEdges } from './drawingMode';
import { computeOrthoMeasureGuides } from './orthoMeasureMath';

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
