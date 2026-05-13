import { Group, Line as KLine, Circle, Rect, Text } from 'react-konva';
import type { Point2D } from '@/types';
import { formatLength } from '@/domain/units';
import { distance } from '@/domain/geometry';
import { OrthoMeasureGuides } from '@/features/drawingTools/OrthoMeasureGuides';
import type { AlignmentGuides } from './useOpeningDraw';

const flatten = (pts: Point2D[]): number[] => {
  const out: number[] = [];
  for (const p of pts) out.push(p.x, p.y);
  return out;
};

export type OpeningRectPreviewProps = {
  origin: Point2D;
  widthMm: number;
  heightMm: number;
  cursor?: Point2D;
};

export const OpeningRectPreview = ({
  origin,
  widthMm,
  heightMm,
  cursor,
}: OpeningRectPreviewProps) => (
  <Group listening={false}>
    {cursor ? <OrthoMeasureGuides cursor={cursor} /> : null}
    <Rect
      x={origin.x}
      y={origin.y}
      width={widthMm}
      height={heightMm}
      stroke="#dc2626"
      strokeWidth={1.5}
      strokeScaleEnabled={false}
      dash={[6, 4]}
      dashEnabled
      fill="rgba(220,38,38,0.10)"
    />
  </Group>
);

export type OpeningPolyPreviewProps = {
  points: Point2D[];
  cursor: Point2D;
  ortho?: boolean;
  alignments?: AlignmentGuides;
};

export const OpeningPolyPreview = ({
  points,
  cursor,
  ortho = false,
  alignments,
}: OpeningPolyPreviewProps) => {
  if (points.length === 0) return null;
  const last = points[points.length - 1]!;
  const rubberStroke = ortho ? '#f59e0b' : '#dc2626';
  const rubberDash = ortho ? [3, 3] : [6, 4];
  const rubberWidth = ortho ? 1.5 : 1.25;
  const len = distance(last, cursor);
  const label = ortho ? `${formatLength(len)}  \u2022 ORTHO` : formatLength(len);
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
        stroke="#dc2626"
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
        <Circle key={i} x={p.x} y={p.y} radius={3} fill="#dc2626" />
      ))}
      {horizontalRef ? (
        <Circle
          x={horizontalRef.x}
          y={horizontalRef.y}
          radius={4}
          stroke="#a855f7"
          strokeWidth={1.25}
          strokeScaleEnabled={false}
        />
      ) : null}
      {verticalRef && verticalRef !== horizontalRef ? (
        <Circle
          x={verticalRef.x}
          y={verticalRef.y}
          radius={4}
          stroke="#a855f7"
          strokeWidth={1.25}
          strokeScaleEnabled={false}
        />
      ) : null}
      <Text
        x={(last.x + cursor.x) / 2}
        y={(last.y + cursor.y) / 2}
        text={label}
        fontSize={11}
        fill={ortho ? '#b45309' : '#7f1d1d'}
        offsetY={14}
      />
    </Group>
  );
};
