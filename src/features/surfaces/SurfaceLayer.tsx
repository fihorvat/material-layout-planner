import { Group, Line as KLine, Text } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { SceneContext } from 'konva/lib/Context';
import {
  useEditorStore,
  useProjectStore,
  useSelectionStore,
  useThemeStore,
  type Theme,
} from '@/state';
import { surfaceCentroid, surfaceArea, surfaceEdges } from '@/domain/surfaces/surfaceGeometry';
import type { Surface, Point2D } from '@/types';
import { EditableEdgeLabel } from '@/features/drawingTools/dimension/EditableEdgeLabel';
import { radToDeg } from '@/domain/geometry';
import { themedShapeColor } from '@/features/editor/canvas/themeColors';
import { OpeningRenderer } from './OpeningRenderer';
import { translateCurrentSelection } from '@/features/editor/selectionClipboard';

const flat = (pts: Point2D[]): number[] => {
  const out: number[] = [];
  for (const p of pts) out.push(p.x, p.y);
  return out;
};

const renderSurface = (
  s: Surface,
  theme: Theme,
  selectedIds: Set<string>,
  activeTool: ReturnType<typeof useEditorStore.getState>['activeTool'],
) => {
  const centroid = surfaceCentroid(s);
  const stroke = themedShapeColor(s.style.strokeColor, theme);
  const fill = themedShapeColor(s.style.fillColor, theme);
  const text = themedShapeColor(s.style.textColor, theme);
  const isDraggable = activeTool === 'select' && selectedIds.has(s.id);
  const lines: React.ReactNode[] = [];
  // Clip the surface's filled outer boundary by the even-odd combination of
  // outer + each hole subpath, so that opening regions are not painted at
  // all. This leaves the openings truly transparent (the canvas grid /
  // underlying layers show through) instead of being masked by an opaque
  // white polygon drawn on top.
  const clipFunc = (ctx: SceneContext) => {
    const outer = s.outerBoundary;
    if (outer.length === 0) return;
    ctx.beginPath();
    ctx.moveTo(outer[0]!.x, outer[0]!.y);
    for (let i = 1; i < outer.length; i++) ctx.lineTo(outer[i]!.x, outer[i]!.y);
    ctx.closePath();
    for (const hole of s.holes) {
      if (hole.length === 0) continue;
      ctx.moveTo(hole[0]!.x, hole[0]!.y);
      for (let i = 1; i < hole.length; i++) ctx.lineTo(hole[i]!.x, hole[i]!.y);
      ctx.closePath();
    }
    return ['evenodd' as CanvasFillRule] as [CanvasFillRule];
  };
  lines.push(
    <Group key={`f:${s.id}`} clipFunc={clipFunc} listening={false}>
      <KLine
        points={flat(s.outerBoundary)}
        closed
        fill={fill}
        opacity={s.style.fillOpacity}
        listening={false}
      />
    </Group>,
  );
  lines.push(
    <KLine
      key={`o:${s.id}`}
      points={flat(s.outerBoundary)}
      closed
      stroke={stroke}
      strokeWidth={s.style.strokeWidthPx}
      strokeScaleEnabled={false}
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
    <Group
      key={s.id}
      draggable={isDraggable}
      onMouseDown={(e: KonvaEventObject<MouseEvent>) => {
        if (isDraggable) e.cancelBubble = true;
      }}
      onDragStart={(e: KonvaEventObject<DragEvent>) => {
        e.cancelBubble = true;
      }}
      onDragMove={(e: KonvaEventObject<DragEvent>) => {
        e.cancelBubble = true;
      }}
      onDragEnd={(e: KonvaEventObject<DragEvent>) => {
        e.cancelBubble = true;
        const dx = e.target.x();
        const dy = e.target.y();
        e.target.position({ x: 0, y: 0 });
        translateCurrentSelection(dx, dy);
      }}
    >
      {lines}
      <OpeningRenderer surface={s} />
    </Group>
  );
};

export const SurfaceLayer = () => {
  const surfaces = useProjectStore((s) => s.project.surfaces);
  const activeTool = useEditorStore((s) => s.activeTool);
  const selected = useSelectionStore((s) => s.selected);
  const theme = useThemeStore((s) => s.theme);
  const selectedIds = new Set(
    selected.filter((entry) => entry.kind === 'surface').map((entry) => entry.id),
  );
  return (
    <Group>
      {surfaces.map((surface) => renderSurface(surface, theme, selectedIds, activeTool))}
    </Group>
  );
};
