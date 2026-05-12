import { Group, Line as KLine, Text } from 'react-konva';
import type { Point2D } from '@/types';
import { lineLength, lineAngleDeg, segmentMidpoint } from '@/domain/geometry';
import { formatLength } from '@/domain/units';

export type LinePreviewProps = {
  first: Point2D;
  cursor: Point2D;
};

export const LinePreview = ({ first, cursor }: LinePreviewProps) => {
  const seg = { a: first, b: cursor };
  const length = lineLength(seg);
  const angle = lineAngleDeg(seg);
  const mid = segmentMidpoint(seg);
  return (
    <Group listening={false}>
      <KLine
        points={[first.x, first.y, cursor.x, cursor.y]}
        stroke="#2563eb"
        strokeWidth={1.25}
        strokeScaleEnabled={false}
        dash={[6, 4]}
        dashEnabled
      />
      <Text
        x={mid.x}
        y={mid.y}
        text={`${formatLength(length)} @ ${angle.toFixed(1)}\u00B0`}
        fontSize={12}
        fill="#1f2937"
        offsetY={16}
      />
    </Group>
  );
};
