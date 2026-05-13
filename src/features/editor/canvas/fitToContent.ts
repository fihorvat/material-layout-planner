import type { Project } from '@/types';
import {
  pointsToAabb,
  rectangleToPoints,
  unionAabb,
  type Aabb,
} from '@/domain/geometry';
import { clampZoom, type Viewport } from '@/state';

/**
 * Returns an axis-aligned bounding box (in world/mm coordinates) that
 * encloses everything the user can normally see and interact with in the
 * project: drawing entities, surfaces (and their holes) and free labels.
 * Returns `null` when there is no content to fit to.
 */
export const computeProjectContentBounds = (project: Project): Aabb | null => {
  const boxes: Aabb[] = [];

  for (const e of project.drawingEntities) {
    if (e.type === 'line') {
      boxes.push(pointsToAabb([e.start, e.end]));
    } else if (e.type === 'rectangle') {
      boxes.push(
        pointsToAabb(
          rectangleToPoints(e.origin, e.widthMm, e.heightMm, e.rotationDeg ?? 0),
        ),
      );
    } else if (e.type === 'polygon') {
      boxes.push(pointsToAabb(e.points));
    }
  }

  for (const s of project.surfaces) {
    boxes.push(pointsToAabb(s.outerBoundary));
    for (const hole of s.holes) {
      boxes.push(pointsToAabb(hole));
    }
  }

  for (const l of project.labels) {
    if (l.anchorType === 'free') {
      boxes.push(pointsToAabb([l.position]));
    }
  }

  if (boxes.length === 0) return null;

  let acc = boxes[0]!;
  for (let i = 1; i < boxes.length; i++) {
    acc = unionAabb(acc, boxes[i]!);
  }
  return acc;
};

/**
 * Computes the viewport (offset + scale) that frames the given world-space
 * bounding box inside a stage of the given pixel size, leaving `paddingPx`
 * of breathing room on each side. The resulting scale is clamped to the
 * editor's zoom limits.
 *
 * The world layer is rendered as `screen = world * scale + offset`, so we
 * pick `offset = stageCenter - contentCenter * scale` to center the bbox.
 */
export const computeFitViewport = (
  content: Aabb,
  stage: { width: number; height: number },
  paddingPx = 32,
): Viewport => {
  const contentW = Math.max(1e-6, content.maxX - content.minX);
  const contentH = Math.max(1e-6, content.maxY - content.minY);
  const usableW = Math.max(1, stage.width - paddingPx * 2);
  const usableH = Math.max(1, stage.height - paddingPx * 2);
  const scale = clampZoom(Math.min(usableW / contentW, usableH / contentH));
  const centerX = (content.minX + content.maxX) / 2;
  const centerY = (content.minY + content.maxY) / 2;
  const offsetXPx = stage.width / 2 - centerX * scale;
  const offsetYPx = stage.height / 2 - centerY * scale;
  return { offsetXPx, offsetYPx, scale };
};
