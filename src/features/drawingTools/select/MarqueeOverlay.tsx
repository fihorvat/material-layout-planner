import { Rect } from 'react-konva';
import type { Point2D } from '@/types';

export type MarqueeOverlayProps = {
  start: Point2D;
  end: Point2D;
};

export const MarqueeOverlay = ({ start, end }: MarqueeOverlayProps) => {
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  const w = Math.abs(end.x - start.x);
  const h = Math.abs(end.y - start.y);
  return (
    <Rect
      x={x}
      y={y}
      width={w}
      height={h}
      stroke="#2563eb"
      strokeWidth={1}
      strokeScaleEnabled={false}
      dash={[4, 4]}
      dashEnabled
      fill="rgba(37, 99, 235, 0.08)"
      listening={false}
    />
  );
};
