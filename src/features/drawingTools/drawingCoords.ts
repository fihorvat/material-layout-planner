import type Konva from 'konva';
import type { Point2D, Project } from '@/types';
import { useEditorStore } from '@/state';
import { screenToWorld } from '@/features/editor/canvas/coords';

/**
 * Resolve the current pointer position on a Konva stage into world (mm)
 * coordinates using the active editor viewport.
 *
 * Returns `null` when the stage isn't mounted or the pointer hasn't moved
 * over it yet. Six different drawing-tool hooks defined this same helper
 * locally before being deduplicated here; behaviour must remain identical.
 */
export const resolveWorldFromStage = (
  stageRef: React.RefObject<Konva.Stage | null>,
): Point2D | null => {
  const stage = stageRef.current;
  if (!stage) return null;
  const pos = stage.getPointerPosition();
  if (!pos) return null;
  const viewport = useEditorStore.getState().viewport;
  return screenToWorld(pos.x, pos.y, viewport);
};

/**
 * Collect every drawing-entity vertex that the snap engine can lock onto:
 * line endpoints, rectangle corners (axis-aligned, pre-rotation), and
 * polygon vertices. Rotated rectangles fall back to their raw origin/size
 * footprint here for backwards compatibility with the per-hook helpers
 * this replaces.
 */
export const collectSnapCandidates = (project: Project): Point2D[] => {
  const pts: Point2D[] = [];
  for (const e of project.drawingEntities) {
    if (e.type === 'line') {
      pts.push(e.start, e.end);
    } else if (e.type === 'rectangle') {
      pts.push(
        { x: e.origin.x, y: e.origin.y },
        { x: e.origin.x + e.widthMm, y: e.origin.y },
        { x: e.origin.x + e.widthMm, y: e.origin.y + e.heightMm },
        { x: e.origin.x, y: e.origin.y + e.heightMm },
      );
    } else if (e.type === 'polygon') {
      pts.push(...e.points);
    }
  }
  return pts;
};
