import { Group, Line as KLine, Text } from 'react-konva';
import { useProjectStore } from '@/state';
import { surfaceCentroid, surfaceArea, surfaceEdges } from '@/domain/surfaces/surfaceGeometry';
import type { Surface, Point2D } from '@/types';
import { formatLength } from '@/domain/units';

const flat = (pts: Point2D[]): number[] => {
  const out: number[] = [];
  for (const p of pts) out.push(p.x, p.y);
  return out;
};

const renderSurface = (s: Surface) => {
  const centroid = surfaceCentroid(s);
  const lines: React.ReactNode[] = [];
  lines.push(
    <KLine
      key={`o:${s.id}`}
      points={flat(s.outerBoundary)}
      closed
      stroke={s.style.strokeColor}
      strokeWidth={s.style.strokeWidthPx}
      strokeScaleEnabled={false}
      fill={s.style.fillColor}
      opacity={s.style.fillOpacity}
    />,
  );
  for (let i = 0; i < s.holes.length; i++) {
    lines.push(
      <KLine
        key={`h:${s.id}:${i}`}
        points={flat(s.holes[i]!)}
        closed
        stroke={s.style.strokeColor}
        strokeWidth={s.style.strokeWidthPx}
        strokeScaleEnabled={false}
        fill="#ffffff"
        opacity={1}
      />,
    );
  }
  if (s.showDimensions) {
    for (const e of surfaceEdges(s)) {
      lines.push(
        <Text
          key={`d:${s.id}:${e.index}`}
          x={e.midpoint.x}
          y={e.midpoint.y}
          text={formatLength(e.lengthMm)}
          fontSize={11}
          fill={s.style.textColor}
          listening={false}
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
        fill={s.style.textColor}
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
        fill={s.style.textColor}
        listening={false}
      />,
    );
  }
  return <Group key={s.id}>{lines}</Group>;
};

export const SurfaceLayer = () => {
  const surfaces = useProjectStore((s) => s.project.surfaces);
  return <Group>{surfaces.map(renderSurface)}</Group>;
};
