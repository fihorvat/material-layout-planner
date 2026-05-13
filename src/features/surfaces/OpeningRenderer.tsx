import { Group, Line as KLine, Text } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { Surface, Point2D } from '@/types';
import { useEditorStore, useSelectionStore, useThemeStore } from '@/state';
import { themedShapeColor } from '@/features/editor/canvas/themeColors';
import { polygonCentroid, radToDeg, distance } from '@/domain/geometry';
import { EditableEdgeLabel } from '@/features/drawingTools/dimension/EditableEdgeLabel';
import { dispatchCommand, updateOpeningCommand } from '@/domain/commands';

const flat = (pts: Point2D[]): number[] => {
  const out: number[] = [];
  for (const p of pts) out.push(p.x, p.y);
  return out;
};

const holeEdges = (
  hole: Point2D[],
): { index: number; a: Point2D; b: Point2D; lengthMm: number; midpoint: Point2D }[] => {
  const out: { index: number; a: Point2D; b: Point2D; lengthMm: number; midpoint: Point2D }[] = [];
  for (let i = 0; i < hole.length; i++) {
    const a = hole[i]!;
    const b = hole[(i + 1) % hole.length]!;
    out.push({
      index: i,
      a,
      b,
      lengthMm: distance(a, b),
      midpoint: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
    });
  }
  return out;
};

type OpeningRendererProps = {
  surface: Surface;
};

const NAME_FONT_PX = 16;

export const OpeningRenderer = ({ surface }: OpeningRendererProps) => {
  const theme = useThemeStore((s) => s.theme);
  const scale = useEditorStore((s) => s.viewport.scale);
  const activeTool = useEditorStore((s) => s.activeTool);
  const selected = useSelectionStore((s) => s.selected);
  const selectedIds = new Set(selected.filter((e) => e.kind === 'opening').map((e) => e.id));
  const nameFontMm = NAME_FONT_PX / scale;

  if (surface.holes.length === 0) return null;
  const items: React.ReactNode[] = [];
  for (let i = 0; i < surface.holes.length; i++) {
    const hole = surface.holes[i]!;
    const meta = surface.holeMeta[i];
    const stroke = meta ? themedShapeColor(meta.style.strokeColor, theme) : '#1f2937';
    const textColor = meta ? themedShapeColor(meta.style.textColor, theme) : '#111827';
    const isSelected = meta ? selectedIds.has(meta.id) : false;
    const strokeWidth = meta?.style.strokeWidthPx ?? 1;
    const fillColor = meta?.style.fillColor
      ? themedShapeColor(meta.style.fillColor, theme)
      : undefined;
    const fillOpacity = meta?.style.fillOpacity ?? 1;
    items.push(
      <KLine
        key={`opn-outline:${surface.id}:${i}`}
        points={flat(hole)}
        closed
        stroke={isSelected ? '#2563eb' : stroke}
        strokeWidth={isSelected ? strokeWidth + 1 : strokeWidth}
        strokeScaleEnabled={false}
        dash={isSelected ? [6, 4] : undefined}
        dashEnabled={isSelected}
        fill={fillColor}
        opacity={fillColor ? fillOpacity : 1}
        listening={false}
      />,
    );
    if (meta?.name) {
      const c = polygonCentroid(hole);
      const offset = meta.labelOffset ?? { x: 0, y: 0 };
      const labelX = c.x + offset.x;
      const labelY = c.y + offset.y;
      const isDraggable = activeTool === 'select' && isSelected;
      const surfaceId = surface.id;
      const openingId = meta.id;
      items.push(
        <Text
          key={`opn-name:${surface.id}:${i}`}
          x={labelX}
          y={labelY}
          text={meta.name}
          fontSize={nameFontMm}
          fontStyle="bold"
          fill={textColor}
          draggable={isDraggable}
          listening={isDraggable}
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
            const nx = e.target.x();
            const ny = e.target.y();
            const newOffset: Point2D = { x: nx - c.x, y: ny - c.y };
            if (newOffset.x === offset.x && newOffset.y === offset.y) return;
            dispatchCommand(
              updateOpeningCommand(
                {
                  surfaceId,
                  openingId,
                  patch: { meta: { labelOffset: newOffset } },
                },
                'Move opening label',
              ),
            );
          }}
        />,
      );
    }
    if (meta?.showDimensions) {
      for (const e of holeEdges(hole)) {
        const angle = radToDeg(Math.atan2(e.b.y - e.a.y, e.b.x - e.a.x));
        items.push(
          <EditableEdgeLabel
            key={`opn-dim:${surface.id}:${i}:${e.index}`}
            midpoint={e.midpoint}
            lengthMm={e.lengthMm}
            angleDeg={angle}
            color={textColor}
            fontSizePx={meta.style.fontSizePx}
            target={{ kind: 'surfaceEdge', surfaceId: surface.id, edgeIndex: e.index }}
          />,
        );
      }
    }
  }
  return <Group>{items}</Group>;
};

