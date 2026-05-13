import { Group, Line as KLine } from 'react-konva';
import type { Point2D } from '@/types';

type CutPreviewProps = {
  first: Point2D;
  cursor: Point2D;
};

export const CutPreview = ({ first, cursor }: CutPreviewProps) => (
  <Group listening={false}>
    <KLine
      points={[first.x, first.y, cursor.x, cursor.y]}
      stroke="#dc2626"
      strokeWidth={1.25}
      strokeScaleEnabled={false}
      dash={[8, 4]}
      dashEnabled
    />
  </Group>
);
