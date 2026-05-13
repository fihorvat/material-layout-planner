import { Group, Line as KLine, Circle, Text } from 'react-konva';
import type { Point2D } from '@/types';
import { formatLength } from '@/domain/units';
import { distance } from '@/domain/geometry';
import { useEditorStore, useThemeStore } from '@/state';
import { themedShapeColor } from '@/features/editor/canvas/themeColors';
import { OrthoMeasureGuides } from '@/features/drawingTools/OrthoMeasureGuides';
import type { AlignmentGuides } from './usePolygonDraw';

// Screen-pixel size of the rubber-band label. Converted to world mm using the
// current viewport scale so the label stays readable at any zoom level.
const LABEL_FONT_PX = 12;
const LABEL_OFFSET_PX = 14;

export type PolygonPreviewProps = {
  points: Point2D[];
  cursor: Point2D;
  ortho?: boolean;
  alignments?: AlignmentGuides;
};

const flatten = (pts: Point2D[]): number[] => {
  const out: number[] = [];
  for (const p of pts) out.push(p.x, p.y);
  return out;
};

export const PolygonPreview = ({
  points,
  cursor,
  ortho = false,
  alignments,
}: PolygonPreviewProps) => {
  const theme = useThemeStore((s) => s.theme);
  const scale = useEditorStore((s) => s.viewport.scale);
  if (points.length === 0) return null;
  const last = points[points.length - 1]!;
  const rubberStroke = ortho ? '#f59e0b' : '#2563eb';
  const rubberDash = ortho ? [3, 3] : [6, 4];
  const rubberWidth = ortho ? 1.5 : 1.25;
  const len = distance(last, cursor);
  const label = ortho
    ? `${formatLength(len)}  \u2022 ORTHO`
    : formatLength(len);
  const fontSizeMm = LABEL_FONT_PX / Math.max(scale, 1e-9);
  const offsetYMm = LABEL_OFFSET_PX / Math.max(scale, 1e-9);
  // Anchor near the cursor (the live endpoint) so the dimension stays
  // visible while drawing long edges, rather than getting buried at the
  // segment midpoint.
  const t = 0.85;
  const anchorX = last.x + (cursor.x - last.x) * t;
  const anchorY = last.y + (cursor.y - last.y) * t;
  const horizontalRef = alignments?.horizontal;
  const verticalRef = alignments?.vertical;
  return (
    <Group listening={false}>
      <OrthoMeasureGuides cursor={cursor} />
      {horizontalRef ? (
        <KLine
          points={[horizontalRef.x, horizontalRef.y, cursor.x, cursor.y]}
          stroke="#a855f7"
          strokeWidth={1}
          strokeScaleEnabled={false}
          dash={[2, 4]}
          dashEnabled
        />
      ) : null}
      {verticalRef ? (
        <KLine
          points={[verticalRef.x, verticalRef.y, cursor.x, cursor.y]}
          stroke="#a855f7"
          strokeWidth={1}
          strokeScaleEnabled={false}
          dash={[2, 4]}
          dashEnabled
        />
      ) : null}
      <KLine
        points={flatten(points)}
        stroke="#2563eb"
        strokeWidth={1.5}
        strokeScaleEnabled={false}
      />
      <KLine
        points={[last.x, last.y, cursor.x, cursor.y]}
        stroke={rubberStroke}
        strokeWidth={rubberWidth}
        strokeScaleEnabled={false}
        dash={rubberDash}
        dashEnabled
      />
      {points.map((p, i) => (
        <Circle
          key={i}
          x={p.x}
          y={p.y}
          radius={3}
          fill="#2563eb"
        />
      ))}
      {horizontalRef ? (
        <Circle x={horizontalRef.x} y={horizontalRef.y} radius={4} stroke="#a855f7" strokeWidth={1.25} strokeScaleEnabled={false} />
      ) : null}
      {verticalRef && verticalRef !== horizontalRef ? (
        <Circle x={verticalRef.x} y={verticalRef.y} radius={4} stroke="#a855f7" strokeWidth={1.25} strokeScaleEnabled={false} />
      ) : null}
      <Text
        x={anchorX}
        y={anchorY}
        text={label}
        fontSize={fontSizeMm}
        fill={ortho ? '#b45309' : themedShapeColor('#1f2937', theme)}
        offsetY={offsetYMm}
      />
    </Group>
  );
};
