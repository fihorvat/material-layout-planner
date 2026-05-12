import { Rect } from 'react-konva';
import type { Point2D } from '@/types';

export type RectanglePreviewProps = {
  origin: Point2D;
  widthMm: number;
  heightMm: number;
};

export const RectanglePreview = ({ origin, widthMm, heightMm }: RectanglePreviewProps) => (
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
    listening={false}
  />
);
