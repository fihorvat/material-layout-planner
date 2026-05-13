import { Group, Line as KLine, Text } from 'react-konva';
import type { Point2D } from '@/types';
import { lineLength, lineAngleDeg, segmentMidpoint } from '@/domain/geometry';
import { formatLength } from '@/domain/units';
import { useThemeStore } from '@/state';
import { themedShapeColor } from '@/features/editor/canvas/themeColors';
import { OrthoMeasureGuides } from '@/features/drawingTools/OrthoMeasureGuides';

export type LinePreviewProps = {
  first: Point2D;
  cursor: Point2D;
  ortho?: boolean;
};

export const LinePreview = ({ first, cursor, ortho = false }: LinePreviewProps) => {
  const seg = { a: first, b: cursor };
  const length = lineLength(seg);
  const angle = lineAngleDeg(seg);
  const mid = segmentMidpoint(seg);
  const theme = useThemeStore((s) => s.theme);
  const stroke = ortho ? '#f59e0b' : '#2563eb';
  const dash = ortho ? [3, 3] : [6, 4];
  const strokeWidth = ortho ? 1.5 : 1.25;
  const label = ortho
    ? `${formatLength(length)} @ ${angle.toFixed(1)}\u00B0  \u2022 ORTHO`
    : `${formatLength(length)} @ ${angle.toFixed(1)}\u00B0`;
  return (
    <Group listening={false}>
      <OrthoMeasureGuides cursor={cursor} />
      <KLine
        points={[first.x, first.y, cursor.x, cursor.y]}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeScaleEnabled={false}
        dash={dash}
        dashEnabled
      />
      <Text
        x={mid.x}
        y={mid.y}
        text={label}
        fontSize={12}
        fill={ortho ? '#b45309' : themedShapeColor('#1f2937', theme)}
        offsetY={16}
      />
    </Group>
  );
};
