import { Group, Line as KLine, Rect, Text } from 'react-konva';
import { useProjectStore } from '@/state';
import type { Point2D, DrawingEntity, LineEntity } from '@/types';
import { lineLength, lineAngleDeg, segmentMidpoint } from '@/domain/geometry';
import { formatLength } from '@/domain/units';

const flat = (points: Point2D[]): number[] => {
  const out: number[] = [];
  for (const p of points) {
    out.push(p.x, p.y);
  }
  return out;
};

const LineDimensionLabel = ({ entity }: { entity: LineEntity }) => {
  if (!entity.showDimension) return null;
  const mid = segmentMidpoint({ a: entity.start, b: entity.end });
  const len = lineLength({ a: entity.start, b: entity.end });
  const angle = lineAngleDeg({ a: entity.start, b: entity.end });
  return (
    <Text
      x={mid.x}
      y={mid.y}
      text={`${formatLength(len)} @ ${angle.toFixed(0)}\u00B0`}
      fontSize={12}
      fill={entity.style.textColor}
      offsetY={16}
      listening={false}
    />
  );
};

const renderEntity = (entity: DrawingEntity) => {
  if (entity.type === 'line') {
    return (
      <Group key={entity.id}>
        <KLine
          points={[entity.start.x, entity.start.y, entity.end.x, entity.end.y]}
          stroke={entity.style.strokeColor}
          strokeWidth={entity.style.strokeWidthPx}
          strokeScaleEnabled={false}
        />
        <LineDimensionLabel entity={entity} />
      </Group>
    );
  }
  if (entity.type === 'rectangle') {
    return (
      <Rect
        key={entity.id}
        x={entity.origin.x}
        y={entity.origin.y}
        width={entity.widthMm}
        height={entity.heightMm}
        rotation={entity.rotationDeg}
        stroke={entity.style.strokeColor}
        strokeWidth={entity.style.strokeWidthPx}
        strokeScaleEnabled={false}
        fill={entity.style.fillColor}
        opacity={entity.style.fillOpacity ?? 1}
      />
    );
  }
  return (
    <KLine
      key={entity.id}
      points={flat(entity.points)}
      closed
      stroke={entity.style.strokeColor}
      strokeWidth={entity.style.strokeWidthPx}
      strokeScaleEnabled={false}
      fill={entity.style.fillColor}
      opacity={entity.style.fillOpacity ?? 1}
    />
  );
};

export const ConstructionEntities = () => {
  const entities = useProjectStore((s) => s.project.drawingEntities);
  return <Group>{entities.map(renderEntity)}</Group>;
};
