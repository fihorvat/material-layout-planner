import { Group, Line as KLine, Circle, Rect } from 'react-konva';
import type { Point2D } from '@/types';

const flatten = (pts: Point2D[]): number[] => {
  const out: number[] = [];
  for (const p of pts) out.push(p.x, p.y);
  return out;
};

export type OpeningRectPreviewProps = {
  origin: Point2D;
  widthMm: number;
  heightMm: number;
};

export const OpeningRectPreview = ({ origin, widthMm, heightMm }: OpeningRectPreviewProps) => (
  <Rect
    x={origin.x}
    y={origin.y}
    width={widthMm}
    height={heightMm}
    stroke="#dc2626"
    strokeWidth={1.5}
    strokeScaleEnabled={false}
    dash={[6, 4]}
    dashEnabled
    fill="rgba(220,38,38,0.10)"
    listening={false}
  />
);

export type OpeningPolyPreviewProps = {
  points: Point2D[];
  cursor: Point2D;
};

export const OpeningPolyPreview = ({ points, cursor }: OpeningPolyPreviewProps) => {
  if (points.length === 0) return null;
  const last = points[points.length - 1]!;
  return (
    <Group listening={false}>
      <KLine
        points={flatten(points)}
        stroke="#dc2626"
        strokeWidth={1.5}
        strokeScaleEnabled={false}
      />
      <KLine
        points={[last.x, last.y, cursor.x, cursor.y]}
        stroke="#dc2626"
        strokeWidth={1.25}
        strokeScaleEnabled={false}
        dash={[6, 4]}
        dashEnabled
      />
      {points.map((p, i) => (
        <Circle key={i} x={p.x} y={p.y} radius={3} fill="#dc2626" />
      ))}
    </Group>
  );
};
