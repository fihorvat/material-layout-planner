import { Group, Line as KLine, Text } from 'react-konva';
import type { Point2D } from '@/types';
import { lineLength, lineAngleDeg } from '@/domain/geometry';
import { formatLength } from '@/domain/units';
import { useEditorStore, useThemeStore } from '@/state';
import { themedShapeColor } from '@/features/editor/canvas/themeColors';
import { OrthoMeasureGuides } from '@/features/drawingTools/OrthoMeasureGuides';

export type LinePreviewProps = {
  first: Point2D;
  cursor: Point2D;
  ortho?: boolean;
};

// Screen-pixel size of the preview label. Converted to world mm using the
// current viewport scale so the label remains the same size on screen at any
// zoom level (otherwise zooming out makes the text invisibly small).
const LABEL_FONT_PX = 13;
const LABEL_OFFSET_PX = 16;

export const LinePreview = ({ first, cursor, ortho = false }: LinePreviewProps) => {
  const seg = { a: first, b: cursor };
  const length = lineLength(seg);
  const angle = lineAngleDeg(seg);
  const scale = useEditorStore((s) => s.viewport.scale);
  const theme = useThemeStore((s) => s.theme);
  const stroke = ortho ? '#f59e0b' : '#2563eb';
  const dash = ortho ? [3, 3] : [6, 4];
  const strokeWidth = ortho ? 1.5 : 1.25;
  const label = ortho
    ? `${formatLength(length)} @ ${angle.toFixed(1)}\u00B0  \u2022 ORTHO`
    : `${formatLength(length)} @ ${angle.toFixed(1)}\u00B0`;
  // Anchor the label near the cursor (end) instead of the midpoint so it stays
  // visible while drawing long lines, especially when chains overlap.
  const t = 0.85;
  const anchor: Point2D = {
    x: first.x + (cursor.x - first.x) * t,
    y: first.y + (cursor.y - first.y) * t,
  };
  const fontSizeMm = LABEL_FONT_PX / Math.max(scale, 1e-9);
  const offsetYMm = LABEL_OFFSET_PX / Math.max(scale, 1e-9);
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
        x={anchor.x}
        y={anchor.y}
        text={label}
        fontSize={fontSizeMm}
        fill={ortho ? '#b45309' : themedShapeColor('#1f2937', theme)}
        offsetY={offsetYMm}
      />
    </Group>
  );
};
