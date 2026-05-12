import { Group, Line as KLine, Circle, Text } from 'react-konva';
import type { Point2D } from '@/types';
import { formatLength } from '@/domain/units';
import { distance } from '@/domain/geometry';

export type PolygonPreviewProps = {
  points: Point2D[];
  cursor: Point2D;
};

const flatten = (pts: Point2D[]): number[] => {
  const out: number[] = [];
  for (const p of pts) out.push(p.x, p.y);
  return out;
};

export const PolygonPreview = ({ points, cursor }: PolygonPreviewProps) => {
  if (points.length === 0) return null;
  const last = points[points.length - 1]!;
  return (
    <Group listening={false}>
      <KLine
        points={flatten(points)}
        stroke="#2563eb"
        strokeWidth={1.5}
        strokeScaleEnabled={false}
      />
      <KLine
        points={[last.x, last.y, cursor.x, cursor.y]}
        stroke="#2563eb"
        strokeWidth={1.25}
        strokeScaleEnabled={false}
        dash={[6, 4]}
        dashEnabled
      />
      {points.map((p, i) => (
        <Circle
          key={i}
          x={p.x}
          y={p.y}
          radius={3}
          fill="#2563eb"
        />
      ))}
      <Text
        x={(last.x + cursor.x) / 2}
        y={(last.y + cursor.y) / 2}
        text={formatLength(distance(last, cursor))}
        fontSize={11}
        fill="#1f2937"
        offsetY={14}
      />
    </Group>
  );
};
