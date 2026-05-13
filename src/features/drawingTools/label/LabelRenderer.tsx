import { Group, Text } from 'react-konva';
import type { LabelEntity, Project } from '@/types';
import { computeAnchorPosition } from './computeAnchorPosition';
import { useThemeStore } from '@/state';
import { themedShapeColor } from '@/features/editor/canvas/themeColors';

export type LabelRendererProps = {
  labels: LabelEntity[];
  project: Project;
};

export const LabelRenderer = ({ labels, project }: LabelRendererProps) => {
  const theme = useThemeStore((s) => s.theme);
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
            fill={themedShapeColor(label.style.textColor, theme)}
            fontStyle={label.style.italic ? 'italic' : 'normal'}
            fontVariant={label.style.bold ? 'bold' : 'normal'}
            rotation={label.rotationDeg}
          />
        );
      })}
    </Group>
  );
};
