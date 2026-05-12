import { Group, Text } from 'react-konva';
import type { LabelEntity, Project } from '@/types';
import { computeAnchorPosition } from './computeAnchorPosition';

export type LabelRendererProps = {
  labels: LabelEntity[];
  project: Project;
};

export const LabelRenderer = ({ labels, project }: LabelRendererProps) => {
  return (
    <Group>
      {labels.map((label) => {
        const pos = computeAnchorPosition(label, project);
        if (!pos) return null;
        return (
          <Text
            key={label.id}
            x={pos.x}
            y={pos.y}
            text={label.text}
            fontSize={label.style.fontSizePx}
            fill={label.style.textColor}
            fontStyle={label.style.italic ? 'italic' : 'normal'}
            fontVariant={label.style.bold ? 'bold' : 'normal'}
            rotation={label.rotationDeg}
          />
        );
      })}
    </Group>
  );
};
