import { Group, Text } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { LabelEntity, Project } from '@/types';
import { computeAnchorPosition } from './computeAnchorPosition';
import { useThemeStore, useSelectionStore, useEditorStore } from '@/state';
import { themedShapeColor } from '@/features/editor/canvas/themeColors';
import { dispatchCommand, updateLabelCommand } from '@/domain/commands';

export type LabelRendererProps = {
  labels: LabelEntity[];
  project: Project;
};

export const LabelRenderer = ({ labels, project }: LabelRendererProps) => {
  const theme = useThemeStore((s) => s.theme);
  const selected = useSelectionStore((s) => s.selected);
  const activeTool = useEditorStore((s) => s.activeTool);
  const selectedLabelIds = new Set(
    selected.filter((e) => e.kind === 'label').map((e) => e.id),
  );
  return (
    <Group>
      {labels.map((label) => {
        const pos = computeAnchorPosition(label, project);
        if (!pos) return null;
        const isDraggable =
          activeTool === 'select' && selectedLabelIds.has(label.id);
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
              const dx = e.target.x() - pos.x;
              const dy = e.target.y() - pos.y;
              if (dx === 0 && dy === 0) return;
              dispatchCommand(
                updateLabelCommand(
                  {
                    id: label.id,
                    patch: {
                      position: {
                        x: label.position.x + dx,
                        y: label.position.y + dy,
                      },
                    },
                  },
                  'Move label',
                ),
              );
            }}
          />
        );
      })}
    </Group>
  );
};
