import { Group, Rect, Text } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { Point2D } from '@/types';
import { useEditorStore, useDimensionEditStore, useThemeStore, type DimensionEditTarget } from '@/state';
import { formatLength } from '@/domain/units';
import { themedShapeColor } from '@/features/editor/canvas/themeColors';

type EditableEdgeLabelProps = {
  midpoint: Point2D;
  lengthMm: number;
  angleDeg?: number;
  target: DimensionEditTarget;
  color?: string;
  fontSizePx?: number;
};

const PAD_X_PX = 4;
const PAD_Y_PX = 2;
const APPROX_CHAR_WIDTH = 0.62;

export const EditableEdgeLabel = ({
  midpoint,
  lengthMm,
  angleDeg = 0,
  target,
  color = '#111827',
  fontSizePx = 11,
}: EditableEdgeLabelProps) => {
  const scale = useEditorStore((s) => s.viewport.scale);
  const startEdit = useDimensionEditStore((s) => s.startEdit);
  const editing = useDimensionEditStore((s) => s.editing);
  const theme = useThemeStore((s) => s.theme);
  const labelBg = themedShapeColor('#ffffff', theme);
  const labelBorder = themedShapeColor('#cbd5e1', theme);

  const isEditing =
    editing != null &&
    editing.kind === target.kind &&
    ('entityId' in target && 'entityId' in editing
      ? editing.entityId === target.entityId
      : true) &&
    ('surfaceId' in target && 'surfaceId' in editing
      ? editing.surfaceId === target.surfaceId
      : true) &&
    ('edgeIndex' in target && 'edgeIndex' in editing
      ? editing.edgeIndex === target.edgeIndex
      : true);

  const text = formatLength(lengthMm);
  // Convert px sizes to world mm based on viewport scale so they look constant.
  const fontSizeMm = fontSizePx / scale;
  const padX = PAD_X_PX / scale;
  const padY = PAD_Y_PX / scale;
  const textWidth = text.length * fontSizeMm * APPROX_CHAR_WIDTH;
  const textHeight = fontSizeMm;
  const boxWidth = textWidth + padX * 2;
  const boxHeight = textHeight + padY * 2;

  // Keep labels right-side-up for readability.
  const a = ((angleDeg + 540) % 360) - 180;
  const flip = a > 90 || a < -90;
  const rot = flip ? a + 180 : a;

  const onClick = (e: KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    startEdit(target);
  };

  return (
    <Group x={midpoint.x} y={midpoint.y} rotation={rot} listening>
      <Rect
        x={-boxWidth / 2}
        y={-boxHeight - padY * 2}
        width={boxWidth}
        height={boxHeight}
        fill={isEditing ? '#fef3c7' : labelBg}
        stroke={isEditing ? '#b45309' : labelBorder}
        strokeWidth={1}
        strokeScaleEnabled={false}
        cornerRadius={padY}
        opacity={0.95}
        onClick={onClick}
        onTap={onClick}
        onMouseEnter={(e: KonvaEventObject<MouseEvent>) => {
          const stage = e.target.getStage();
          if (stage) stage.container().style.cursor = 'pointer';
        }}
        onMouseLeave={(e: KonvaEventObject<MouseEvent>) => {
          const stage = e.target.getStage();
          if (stage) stage.container().style.cursor = '';
        }}
      />
      <Text
        x={-boxWidth / 2 + padX}
        y={-boxHeight - padY}
        width={textWidth}
        text={text}
        align="center"
        wrap="none"
        ellipsis={false}
        fontSize={fontSizeMm}
        fill={isEditing ? '#78350f' : color}
        listening={false}
      />
    </Group>
  );
};
