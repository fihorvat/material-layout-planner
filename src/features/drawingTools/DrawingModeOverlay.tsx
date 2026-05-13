import { Group, Circle, Rect } from 'react-konva';
import { useEditorStore, useProjectStore } from '@/state';
import {
  collectShapeBoundingBoxes,
  collectShapeVertices,
} from './drawingMode';

const VERTEX_DOT_RADIUS_PX = 3.5;
const VERTEX_DOT_FILL = '#ffffff';
const VERTEX_DOT_STROKE = '#2563eb';
const VERTEX_DOT_STROKE_WIDTH_PX = 1;

const BBOX_STROKE = '#94a3b8';
const BBOX_DASH: number[] = [4, 4];
const BBOX_STROKE_WIDTH_PX = 1;

/**
 * Renders visual snap aids while a drawing tool is active:
 *  - small dots at every shape vertex on the canvas so the user can see
 *    where snapping will engage,
 *  - faint dashed bounding rectangles around polygons and surfaces so the
 *    user can hold Shift to snap a line onto an existing shape's bbox edge
 *    for perfect 90 degree corners.
 *
 * The overlay is intentionally non-interactive (listening=false) so it
 * never intercepts pointer events from the active drawing tool.
 */
export const DrawingModeOverlay = () => {
  const project = useProjectStore((s) => s.project);
  const scale = useEditorStore((s) => s.viewport.scale);

  const vertices = collectShapeVertices(project);
  const bboxes = collectShapeBoundingBoxes(project);
  if (vertices.length === 0 && bboxes.length === 0) return null;

  const dotRadius = VERTEX_DOT_RADIUS_PX / Math.max(scale, 1e-9);

  return (
    <Group listening={false}>
      {bboxes.map(({ id, bbox }) => (
        <Rect
          key={`bbox:${id}`}
          x={bbox.minX}
          y={bbox.minY}
          width={bbox.maxX - bbox.minX}
          height={bbox.maxY - bbox.minY}
          stroke={BBOX_STROKE}
          strokeWidth={BBOX_STROKE_WIDTH_PX}
          strokeScaleEnabled={false}
          dash={BBOX_DASH}
          dashEnabled
          listening={false}
        />
      ))}
      {vertices.map((p, i) => (
        <Circle
          key={`v:${i}`}
          x={p.x}
          y={p.y}
          radius={dotRadius}
          fill={VERTEX_DOT_FILL}
          stroke={VERTEX_DOT_STROKE}
          strokeWidth={VERTEX_DOT_STROKE_WIDTH_PX}
          strokeScaleEnabled={false}
          listening={false}
        />
      ))}
    </Group>
  );
};
