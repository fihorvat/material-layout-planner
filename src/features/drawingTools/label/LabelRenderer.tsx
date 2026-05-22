import { Group, Text } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { LabelEntity, Project } from '@/types';
import { computeAnchorPosition } from './computeAnchorPosition';
import { useThemeStore, useSelectionStore, useEditorStore, useLabelUiStore } from '@/state';
import { themedShapeColor } from '@/features/editor/canvas/themeColors';
import { dispatchCommand, updateLabelCommand } from '@/domain/commands';
import { getLabelDisplayText, getLabelFontStyle } from './labelPresentation';

type LabelRendererProps = {
  labels: LabelEntity[];
  project: Project;
};

export const LabelRenderer = ({ labels, project }: LabelRendererProps) => {
  const theme = useThemeStore((s) => s.theme);
  const selected = useSelectionStore((s) => s.selected);
  const activeTool = useEditorStore((s) => s.activeTool);
  const dragPreviewPositions = useLabelUiStore((s) => s.dragPreviewPositions);
  const setDragPreview = useLabelUiStore((s) => s.setDragPreview);
  const clearDragPreview = useLabelUiStore((s) => s.clearDragPreview);
  const startEdit = useLabelUiStore((s) => s.startEdit);
  const selectedLabelIds = new Set(
    selected.filter((e) => e.kind === 'label').map((e) => e.id),
  );
  return (
    <Group>
      {labels.map((label) => {
        const anchorPos = computeAnchorPosition(label, project);
        if (!anchorPos) return null;
        const pos = dragPreviewPositions[label.id] ?? anchorPos;
        const isDraggable =
          activeTool === 'select' && selectedLabelIds.has(label.id);
        const text = getLabelDisplayText(label.text, label.style);
        return (
          <Text
            key={label.id}
            x={pos.x}
            y={pos.y}
            text={text}
            fontSize={label.style.fontSizePx}
            fill={themedShapeColor(label.style.textColor, theme)}
            fontStyle={getLabelFontStyle(label.style)}
            rotation={label.rotationDeg}
            draggable={isDraggable}
            onMouseDown={(e: KonvaEventObject<MouseEvent>) => {
              if (isDraggable) e.cancelBubble = true;
            }}
            onDragStart={(e: KonvaEventObject<DragEvent>) => {
              e.cancelBubble = true;
              setDragPreview(label.id, { x: e.target.x(), y: e.target.y() });
            }}
            onDragMove={(e: KonvaEventObject<DragEvent>) => {
              e.cancelBubble = true;
              setDragPreview(label.id, { x: e.target.x(), y: e.target.y() });
            }}
            onDragEnd={(e: KonvaEventObject<DragEvent>) => {
              e.cancelBubble = true;
              const nextPos = { x: e.target.x(), y: e.target.y() };
              const dx = nextPos.x - anchorPos.x;
              const dy = nextPos.y - anchorPos.y;
              if (dx === 0 && dy === 0) {
                clearDragPreview(label.id);
                return;
              }
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
              clearDragPreview(label.id);
            }}
            onDblClick={(e: KonvaEventObject<MouseEvent>) => {
              e.cancelBubble = true;
              startEdit(label.id);
            }}
          />
        );
      })}
    </Group>
  );
};
