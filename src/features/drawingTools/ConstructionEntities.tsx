import { Group, Line as KLine, Rect } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import { useEditorStore, useProjectStore, useSelectionStore, useThemeStore, type Theme } from '@/state';
import type {
  Point2D,
  DrawingEntity,
  LineEntity,
  RectangleEntity,
  PolygonEntity,
} from '@/types';
import {
  lineLength,
  lineAngleDeg,
  distance,
  radToDeg,
} from '@/domain/geometry';
import { EditableEdgeLabel } from './dimension/EditableEdgeLabel';
import { themedShapeColor } from '@/features/editor/canvas/themeColors';
import { translateCurrentSelection } from '@/features/editor/selectionClipboard';

const flat = (points: Point2D[]): number[] => {
  const out: number[] = [];
  for (const p of points) {
    out.push(p.x, p.y);
  }
  return out;
};

const LineDimensions = ({ entity, theme }: { entity: LineEntity; theme: Theme }) => {
  if (!entity.showDimension) return null;
  const len = lineLength({ a: entity.start, b: entity.end });
  const angle = lineAngleDeg({ a: entity.start, b: entity.end });
  // Anchor the dimension label near the end of the line so it stays visible
  // when many lines overlap near a common midpoint area. Pull back slightly
  // from the exact endpoint so the label sits over the line, not past it.
  const anchor: Point2D = {
    x: entity.start.x + (entity.end.x - entity.start.x) * 0.85,
    y: entity.start.y + (entity.end.y - entity.start.y) * 0.85,
  };
  return (
    <EditableEdgeLabel
      midpoint={anchor}
      lengthMm={len}
      angleDeg={angle}
      color={themedShapeColor(entity.style.textColor, theme)}
      fontSizePx={entity.style.fontSizePx}
      target={{ kind: 'line', entityId: entity.id }}
    />
  );
};

const RectangleDimensions = ({ entity, theme }: { entity: RectangleEntity; theme: Theme }) => {
  if (!entity.showDimensions) return null;
  const x = entity.origin.x;
  const y = entity.origin.y;
  const w = entity.widthMm;
  const h = entity.heightMm;
  const topMid: Point2D = { x: x + w / 2, y };
  const rightMid: Point2D = { x: x + w, y: y + h / 2 };
  const color = themedShapeColor(entity.style.textColor, theme);
  return (
    <>
      <EditableEdgeLabel
        midpoint={topMid}
        lengthMm={w}
        angleDeg={0}
        color={color}
        fontSizePx={entity.style.fontSizePx}
        target={{ kind: 'rectWidth', entityId: entity.id }}
      />
      <EditableEdgeLabel
        midpoint={rightMid}
        lengthMm={h}
        angleDeg={90}
        color={color}
        fontSizePx={entity.style.fontSizePx}
        target={{ kind: 'rectHeight', entityId: entity.id }}
      />
    </>
  );
};

const PolygonDimensions = ({ entity, theme }: { entity: PolygonEntity; theme: Theme }) => {
  if (!entity.showSegmentDimensions) return null;
  const pts = entity.points;
  const items: React.ReactNode[] = [];
  const color = themedShapeColor(entity.style.textColor, theme);
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]!;
    const b = pts[(i + 1) % pts.length]!;
    const mid: Point2D = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const len = distance(a, b);
    const angle = radToDeg(Math.atan2(b.y - a.y, b.x - a.x));
    items.push(
      <EditableEdgeLabel
        key={`pe:${entity.id}:${i}`}
        midpoint={mid}
        lengthMm={len}
        angleDeg={angle}
        color={color}
        fontSizePx={entity.style.fontSizePx}
        target={{ kind: 'polygonEdge', entityId: entity.id, edgeIndex: i }}
      />,
    );
  }
  return <>{items}</>;
};

const renderEntity = (
  entity: DrawingEntity,
  theme: Theme,
  selectedIds: Set<string>,
  activeTool: ReturnType<typeof useEditorStore.getState>['activeTool'],
) => {
  const stroke = themedShapeColor(entity.style.strokeColor, theme);
  const isDraggable = activeTool === 'select' && selectedIds.has(entity.id);
  if (entity.type === 'line') {
    return (
      <Group
        key={entity.id}
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
        <KLine
          points={[entity.start.x, entity.start.y, entity.end.x, entity.end.y]}
          stroke={stroke}
          strokeWidth={entity.style.strokeWidthPx}
          strokeScaleEnabled={false}
        />
        <LineDimensions entity={entity} theme={theme} />
      </Group>
    );
  }
  if (entity.type === 'rectangle') {
    return (
      <Group
        key={entity.id}
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
        <Rect
          x={entity.origin.x}
          y={entity.origin.y}
          width={entity.widthMm}
          height={entity.heightMm}
          rotation={entity.rotationDeg}
          stroke={stroke}
          strokeWidth={entity.style.strokeWidthPx}
          strokeScaleEnabled={false}
          fill={themedShapeColor(entity.style.fillColor, theme)}
          opacity={entity.style.fillOpacity ?? 1}
        />
        <RectangleDimensions entity={entity} theme={theme} />
      </Group>
    );
  }
  return (
    <Group
      key={entity.id}
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
      <KLine
        points={flat(entity.points)}
        closed
        stroke={stroke}
        strokeWidth={entity.style.strokeWidthPx}
        strokeScaleEnabled={false}
        fill={themedShapeColor(entity.style.fillColor, theme)}
        opacity={entity.style.fillOpacity ?? 1}
      />
      <PolygonDimensions entity={entity} theme={theme} />
    </Group>
  );
};

export const ConstructionEntities = () => {
  const entities = useProjectStore((s) => s.project.drawingEntities);
  const activeTool = useEditorStore((s) => s.activeTool);
  const selected = useSelectionStore((s) => s.selected);
  const theme = useThemeStore((s) => s.theme);
  const selectedIds = new Set(
    selected
      .filter((entry) => entry.kind === 'line' || entry.kind === 'rectangle' || entry.kind === 'polygon')
      .map((entry) => entry.id),
  );
  return <Group>{entities.map((entity) => renderEntity(entity, theme, selectedIds, activeTool))}</Group>;
};
