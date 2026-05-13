import { Group, Line as KLine, Text, Circle } from 'react-konva';
import type { Point2D } from '@/types';
import { lineLength, lineAngleDeg } from '@/domain/geometry';
import { formatLength } from '@/domain/units';
import { useEditorStore, useThemeStore } from '@/state';
import { themedShapeColor } from '@/features/editor/canvas/themeColors';
import { OrthoMeasureGuides } from '@/features/drawingTools/OrthoMeasureGuides';

type MeterPreviewProps = {
  first: Point2D;
  cursor: Point2D;
  /** True when the cursor was projected onto an existing shape edge (Shift). */
  snappedToEdge?: boolean;
};

const LABEL_FONT_PX = 13;
const LABEL_OFFSET_PX = 16;
const ENDPOINT_RADIUS_PX = 4;

const STROKE = '#0ea5e9';
const STROKE_SNAPPED = '#f59e0b';

export const MeterPreview = ({ first, cursor, snappedToEdge = false }: MeterPreviewProps) => {
  const seg = { a: first, b: cursor };
  const length = lineLength(seg);
  const angle = lineAngleDeg(seg);
  const scale = useEditorStore((s) => s.viewport.scale);
  const theme = useThemeStore((s) => s.theme);
  const stroke = snappedToEdge ? STROKE_SNAPPED : STROKE;
  const label = snappedToEdge
    ? `${formatLength(length)} @ ${angle.toFixed(1)}\u00B0  \u2022 EDGE`
    : `${formatLength(length)} @ ${angle.toFixed(1)}\u00B0`;
  const t = 0.85;
  const anchor: Point2D = {
    x: first.x + (cursor.x - first.x) * t,
    y: first.y + (cursor.y - first.y) * t,
  };
  const fontSizeMm = LABEL_FONT_PX / Math.max(scale, 1e-9);
  const offsetYMm = LABEL_OFFSET_PX / Math.max(scale, 1e-9);
  const dotRadiusMm = ENDPOINT_RADIUS_PX / Math.max(scale, 1e-9);
  return (
    <Group listening={false}>
      <OrthoMeasureGuides cursor={cursor} />
      <KLine
        points={[first.x, first.y, cursor.x, cursor.y]}
        stroke={stroke}
        strokeWidth={1.5}
        strokeScaleEnabled={false}
        dash={[6, 4]}
        dashEnabled
      />
      <Circle x={first.x} y={first.y} radius={dotRadiusMm} fill={stroke} />
      <Circle x={cursor.x} y={cursor.y} radius={dotRadiusMm} fill={stroke} />
      <Text
        x={anchor.x}
        y={anchor.y}
        text={label}
        fontSize={fontSizeMm}
        fill={snappedToEdge ? '#b45309' : themedShapeColor('#1f2937', theme)}
        offsetY={offsetYMm}
      />
    </Group>
  );
};
