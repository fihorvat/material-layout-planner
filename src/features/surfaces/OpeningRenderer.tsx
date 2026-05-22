import { Group, Line as KLine, Text } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { Surface, Point2D } from '@/types';
import { useEditorStore, useSelectionStore, useThemeStore } from '@/state';
import { defaultDrawingStyle } from '@/types';
import { themedShapeColor } from '@/features/editor/canvas/themeColors';
import { polygonCentroid, radToDeg, distance } from '@/domain/geometry';
import { EditableEdgeLabel } from '@/features/drawingTools/dimension/EditableEdgeLabel';
import { dispatchCommand, updateOpeningCommand } from '@/domain/commands';
import { translateCurrentSelection } from '@/features/editor/selectionClipboard';
import {
  resolveSelectionDragDelta,
  useSelectionMovePreviewStore,
} from '@/features/drawingTools/select/SelectionMoveGuides';

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
    const openingId = meta?.id ?? `${surface.id}:hole:${i}`;
    const style = meta?.style ?? defaultDrawingStyle();
    const showDimensions = meta?.showDimensions ?? true;
    const stroke = themedShapeColor(style.strokeColor, theme);
    const textColor = themedShapeColor(style.textColor, theme);
    const isSelected = selectedIds.has(openingId);
    const strokeWidth = style.strokeWidthPx ?? 1;
    const fillColor = style.fillColor
      ? themedShapeColor(style.fillColor, theme)
      : undefined;
    const fillOpacity = style.fillOpacity ?? 1;
    const isDraggable = activeTool === 'select' && isSelected;
    const openingNodes: React.ReactNode[] = [
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
        listening={!meta?.name || !isDraggable}
      />,
    ];
    if (meta?.name) {
      const c = polygonCentroid(hole);
      const offset = meta.labelOffset ?? { x: 0, y: 0 };
      const labelX = c.x + offset.x;
      const labelY = c.y + offset.y;
      const surfaceId = surface.id;
      openingNodes.push(
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
    if (showDimensions) {
      for (const e of holeEdges(hole)) {
        const angle = radToDeg(Math.atan2(e.b.y - e.a.y, e.b.x - e.a.x));
        openingNodes.push(
          <EditableEdgeLabel
            key={`opn-dim:${surface.id}:${i}:${e.index}`}
            midpoint={e.midpoint}
            lengthMm={e.lengthMm}
            angleDeg={angle}
            color={textColor}
            fontSizePx={style.fontSizePx}
            target={{
              kind: 'openingEdge',
              surfaceId: surface.id,
              openingId,
              edgeIndex: e.index,
            }}
          />,
        );
      }
    }
    items.push(
      <Group
        key={`opn:${surface.id}:${i}`}
        draggable={isDraggable}
        onMouseDown={(e: KonvaEventObject<MouseEvent>) => {
          if (isDraggable) e.cancelBubble = true;
        }}
        onDragStart={(e: KonvaEventObject<DragEvent>) => {
          e.cancelBubble = true;
          useSelectionMovePreviewStore.getState().setPreview({ dx: 0, dy: 0 });
        }}
        onDragMove={(e: KonvaEventObject<DragEvent>) => {
          e.cancelBubble = true;
          const next = resolveSelectionDragDelta(e.target.x(), e.target.y(), e.evt.shiftKey);
          if (next.x !== e.target.x() || next.y !== e.target.y()) {
            e.target.position(next);
          }
          useSelectionMovePreviewStore.getState().setPreview({ dx: next.x, dy: next.y });
        }}
        onDragEnd={(e: KonvaEventObject<DragEvent>) => {
          e.cancelBubble = true;
          const next = resolveSelectionDragDelta(e.target.x(), e.target.y(), e.evt.shiftKey);
          const dx = next.x;
          const dy = next.y;
          e.target.position({ x: 0, y: 0 });
          useSelectionMovePreviewStore.getState().clearPreview();
          translateCurrentSelection(dx, dy);
        }}
      >
        {openingNodes}
      </Group>,
    );
  }
  return <Group>{items}</Group>;
};
