import { Group, Line as KLine, Text } from 'react-konva';
import { useProjectStore, useThemeStore, type Theme } from '@/state';
import { surfaceCentroid, surfaceArea, surfaceEdges } from '@/domain/surfaces/surfaceGeometry';
import type { Surface, Point2D } from '@/types';
import { EditableEdgeLabel } from '@/features/drawingTools/dimension/EditableEdgeLabel';
import { radToDeg } from '@/domain/geometry';
import { themedShapeColor } from '@/features/editor/canvas/themeColors';
import { OpeningRenderer } from './OpeningRenderer';

const flat = (pts: Point2D[]): number[] => {
  const out: number[] = [];
  for (const p of pts) out.push(p.x, p.y);
  return out;
};

const renderSurface = (s: Surface, theme: Theme) => {
  const centroid = surfaceCentroid(s);
  const stroke = themedShapeColor(s.style.strokeColor, theme);
  const fill = themedShapeColor(s.style.fillColor, theme);
  const text = themedShapeColor(s.style.textColor, theme);
  const holeFill = themedShapeColor('#ffffff', theme);
  const lines: React.ReactNode[] = [];
  lines.push(
    <KLine
      key={`o:${s.id}`}
      points={flat(s.outerBoundary)}
      closed
      stroke={stroke}
      strokeWidth={s.style.strokeWidthPx}
      strokeScaleEnabled={false}
      fill={fill}
      opacity={s.style.fillOpacity}
    />,
  );
  for (let i = 0; i < s.holes.length; i++) {
    lines.push(
      <KLine
        key={`h:${s.id}:${i}`}
        points={flat(s.holes[i]!)}
        closed
        stroke={stroke}
        strokeWidth={s.style.strokeWidthPx}
        strokeScaleEnabled={false}
        fill={holeFill}
        opacity={1}
      />,
    );
  }
  if (s.showDimensions) {
    for (const e of surfaceEdges(s)) {
      const angle = radToDeg(Math.atan2(e.b.y - e.a.y, e.b.x - e.a.x));
      lines.push(
        <EditableEdgeLabel
          key={`d:${s.id}:${e.index}`}
          midpoint={e.midpoint}
          lengthMm={e.lengthMm}
          angleDeg={angle}
          color={text}
          fontSizePx={11}
          target={{ kind: 'surfaceEdge', surfaceId: s.id, edgeIndex: e.index }}
        />,
      );
    }
  }
  if (s.showName) {
    lines.push(
      <Text
        key={`n:${s.id}`}
        x={centroid.x}
        y={centroid.y}
        text={s.name}
        fontSize={14}
        fill={text}
        listening={false}
      />,
    );
  }
  if (s.showArea) {
    lines.push(
      <Text
        key={`a:${s.id}`}
        x={centroid.x}
        y={centroid.y + 16}
        text={`${(surfaceArea(s) / 1_000_000).toFixed(3)} m\u00B2`}
        fontSize={12}
        fill={text}
        listening={false}
      />,
    );
  }
  return (
    <Group key={s.id}>
      {lines}
      <OpeningRenderer surface={s} />
    </Group>
  );
};

export const SurfaceLayer = () => {
  const surfaces = useProjectStore((s) => s.project.surfaces);
  const theme = useThemeStore((s) => s.theme);
  return <Group>{surfaces.map((s) => renderSurface(s, theme))}</Group>;
};
