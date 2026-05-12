import { Group, Line as KLine, Text, Arrow } from 'react-konva';
import type { DimensionEntity, Project } from '@/types';
import { computeDimension } from './computeDimension';

export type DimensionRendererProps = {
  dimensions: DimensionEntity[];
  project: Project;
};

const renderOne = (dim: DimensionEntity, project: Project) => {
  const computed = computeDimension(dim, project);
  if (!computed) {
    return (
      <Text
        key={dim.id}
        text="?"
        x={0}
        y={0}
        fill="#dc2626"
        fontSize={dim.style.fontSizePx}
      />
    );
  }
  if (computed.kind === 'area') {
    return (
      <Text
        key={dim.id}
        text={computed.valueText}
        x={computed.center.x}
        y={computed.center.y}
        fill={dim.style.textColor}
        fontSize={dim.style.fontSizePx}
      />
    );
  }
  if (computed.kind === 'angle') {
    return (
      <Group key={dim.id}>
        <KLine
          points={[computed.armA.x, computed.armA.y, computed.vertex.x, computed.vertex.y, computed.armB.x, computed.armB.y]}
          stroke={dim.style.strokeColor}
          strokeWidth={dim.style.strokeWidthPx}
          strokeScaleEnabled={false}
        />
        <Text
          x={computed.vertex.x}
          y={computed.vertex.y}
          text={computed.valueText}
          fill={dim.style.textColor}
          fontSize={dim.style.fontSizePx}
        />
      </Group>
    );
  }
  return (
    <Group key={dim.id}>
      <Arrow
        points={[computed.a.x, computed.a.y, computed.b.x, computed.b.y]}
        stroke={dim.style.strokeColor}
        strokeWidth={dim.style.strokeWidthPx}
        strokeScaleEnabled={false}
        fill={dim.style.strokeColor}
        pointerLength={dim.style.arrowSizePx}
        pointerWidth={dim.style.arrowSizePx}
        pointerAtBeginning
      />
      <Text
        x={computed.midpoint.x}
        y={computed.midpoint.y}
        text={computed.valueText}
        fill={dim.style.textColor}
        fontSize={dim.style.fontSizePx}
        offsetY={dim.style.fontSizePx + 2}
      />
    </Group>
  );
};

export const DimensionRenderer = ({ dimensions, project }: DimensionRendererProps) => {
  return <Group>{dimensions.map((d) => renderOne(d, project))}</Group>;
};
