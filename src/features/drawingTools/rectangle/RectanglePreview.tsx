import { Group, Rect } from 'react-konva';
import type { Point2D } from '@/types';
import { OrthoMeasureGuides } from '@/features/drawingTools/OrthoMeasureGuides';

export type RectanglePreviewProps = {
  origin: Point2D;
  widthMm: number;
  heightMm: number;
  cursor?: Point2D;
};

export const RectanglePreview = ({
  origin,
  widthMm,
  heightMm,
  cursor,
}: RectanglePreviewProps) => (
  <Group listening={false}>
    {cursor ? <OrthoMeasureGuides cursor={cursor} /> : null}
    <Rect
      x={origin.x}
      y={origin.y}
      width={widthMm}
      height={heightMm}
      stroke="#2563eb"
      strokeWidth={1.25}
      strokeScaleEnabled={false}
      dash={[6, 4]}
      dashEnabled
      fill="rgba(37,99,235,0.08)"
    />
  </Group>
);
