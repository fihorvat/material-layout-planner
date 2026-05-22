import { Circle, Group, Line as KLine } from 'react-konva';
import type { Point2D } from '@/types';

type CutPreviewProps = {
  edge: { a: Point2D; b: Point2D };
  point: Point2D;
};

export const CutPreview = ({ edge, point }: CutPreviewProps) => (
  <Group listening={false}>
    <KLine
      points={[edge.a.x, edge.a.y, edge.b.x, edge.b.y]}
      stroke="#dc2626"
      strokeWidth={1.25}
      strokeScaleEnabled={false}
      dash={[6, 3]}
      dashEnabled
    />
    <Circle
      x={point.x}
      y={point.y}
      radius={4}
      fill="#fca5a5"
      stroke="#b91c1c"
      strokeWidth={1.25}
      strokeScaleEnabled={false}
    />
  </Group>
);
