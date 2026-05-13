import { Circle, Group, Line } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import { useProjectStore, useSelectionStore, useEditorStore } from '@/state';
import { degToRad } from '@/domain/geometry';
import { computeAnchorPosition } from './computeAnchorPosition';
import { dispatchCommand, updateLabelCommand } from '@/domain/commands';
import type { Point2D } from '@/types';

const APPROX_CHAR_WIDTH = 0.6;
const LABEL_LINE_HEIGHT = 1.2;
const HANDLE_RADIUS_PX = 6;

/**
 * Renders the rotated dashed bounding box around the selected label(s) and a
 * resize handle on the bottom-right corner. Dragging the handle scales the
 * font size proportionally to the new local-X distance from the top-left.
 */
export const LabelEditHandles = () => {
  const selected = useSelectionStore((s) => s.selected);
  const project = useProjectStore((s) => s.project);
  const activeTool = useEditorStore((s) => s.activeTool);
  const scale = useEditorStore((s) => s.viewport.scale);

  if (activeTool !== 'select') return null;
  const entries = selected.filter((e) => e.kind === 'label');
  if (entries.length === 0) return null;

  return (
    <>
      {entries.map((entry) => {
        const label = project.labels.find((l) => l.id === entry.id);
        if (!label) return null;
        const pos = computeAnchorPosition(label, project);
        if (!pos) return null;

        const fontSize = label.style.fontSizePx;
        const width = Math.max(label.text.length, 1) * fontSize * APPROX_CHAR_WIDTH;
        const height = fontSize * LABEL_LINE_HEIGHT;
        const rad = degToRad(label.rotationDeg);
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        const tl: Point2D = { x: pos.x, y: pos.y };
        const tr: Point2D = { x: pos.x + width * cos, y: pos.y + width * sin };
        const br: Point2D = {
          x: pos.x + width * cos - height * sin,
          y: pos.y + width * sin + height * cos,
        };
        const bl: Point2D = { x: pos.x - height * sin, y: pos.y + height * cos };
        const r = HANDLE_RADIUS_PX / scale;

        return (
          <Group key={`lh:${label.id}`}>
            <Line
              points={[tl.x, tl.y, tr.x, tr.y, br.x, br.y, bl.x, bl.y]}
              closed
              stroke="#2563eb"
              strokeWidth={1.5}
              strokeScaleEnabled={false}
              dash={[6, 4]}
              listening={false}
            />
            <Circle
              x={br.x}
              y={br.y}
              radius={r}
              fill="#ffffff"
              stroke="#2563eb"
              strokeWidth={1.5}
              strokeScaleEnabled={false}
              draggable
              onMouseDown={(e: KonvaEventObject<MouseEvent>) => {
                e.cancelBubble = true;
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
                // Inverse-rotate into the label's local frame.
                const localX = dx * cos + dy * sin;
                if (width <= 0 || localX <= 0) return;
                const ratio = localX / width;
                const newFontSize = Math.max(1, fontSize * ratio);
                dispatchCommand(
                  updateLabelCommand(
                    {
                      id: label.id,
                      patch: {
                        style: { ...label.style, fontSizePx: newFontSize },
                      },
                    },
                    'Resize label',
                  ),
                );
              }}
              onMouseEnter={(e: KonvaEventObject<MouseEvent>) => {
                const stage = e.target.getStage();
                if (stage) stage.container().style.cursor = 'nwse-resize';
              }}
              onMouseLeave={(e: KonvaEventObject<MouseEvent>) => {
                const stage = e.target.getStage();
                if (stage) stage.container().style.cursor = '';
              }}
            />
          </Group>
        );
      })}
    </>
  );
};
