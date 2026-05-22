import type { Point2D, Project } from '@/types';
import { decodeEdgeId } from '@/domain/surfaces/connectSurfaces';

export type PatternContinuationPlacement = {
  anchorSurfaceId: string;
  virtualOffset: Point2D;
  originTranslation: Point2D;
};

type ContinuationNeighbor = {
  nextSurfaceId: string;
  currentEdgeId: string;
  nextEdgeId: string;
};

const COLLINEAR_EPS = 1e-3;

const edgeReferencePoint = (
  surface: Pick<Project['surfaces'][number], 'outerBoundary'>,
  edgeId: string,
): Point2D => {
  const { edgeIndex } = decodeEdgeId(edgeId);
  const points = surface.outerBoundary;
  const start = points[edgeIndex] ?? points[0] ?? { x: 0, y: 0 };
  const end = points[(edgeIndex + 1) % Math.max(points.length, 1)] ?? start;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.hypot(dx, dy);
  if (len < 1e-9) {
    return {
      x: (start.x + end.x) / 2,
      y: (start.y + end.y) / 2,
    };
  }

  const ux = dx / len;
  const uy = dy / len;
  const nx = -uy;
  const ny = ux;
  const lineOffset = start.x * nx + start.y * ny;
  let minAlong = Infinity;
  let maxAlong = -Infinity;

  for (let index = 0; index < points.length; index++) {
    const edgeStart = points[index] ?? start;
    const edgeEnd = points[(index + 1) % points.length] ?? edgeStart;
    const edgeDx = edgeEnd.x - edgeStart.x;
    const edgeDy = edgeEnd.y - edgeStart.y;
    const edgeLen = Math.hypot(edgeDx, edgeDy);
    if (edgeLen < 1e-9) continue;
    const edgeUx = edgeDx / edgeLen;
    const edgeUy = edgeDy / edgeLen;
    const parallelMeasure = Math.abs(ux * edgeUy - uy * edgeUx);
    if (parallelMeasure > COLLINEAR_EPS) continue;

    const startOffset = edgeStart.x * nx + edgeStart.y * ny;
    const endOffset = edgeEnd.x * nx + edgeEnd.y * ny;
    if (
      Math.abs(startOffset - lineOffset) > COLLINEAR_EPS ||
      Math.abs(endOffset - lineOffset) > COLLINEAR_EPS
    ) {
      continue;
    }

    const startAlong = edgeStart.x * ux + edgeStart.y * uy;
    const endAlong = edgeEnd.x * ux + edgeEnd.y * uy;
    minAlong = Math.min(minAlong, startAlong, endAlong);
    maxAlong = Math.max(maxAlong, startAlong, endAlong);
  }

  if (!Number.isFinite(minAlong) || !Number.isFinite(maxAlong)) {
    return {
      x: (start.x + end.x) / 2,
      y: (start.y + end.y) / 2,
    };
  }

  const centerAlong = (minAlong + maxAlong) / 2;
  return {
    x: ux * centerAlong + nx * lineOffset,
    y: uy * centerAlong + ny * lineOffset,
  };
};

const addPoints = (a: Point2D, b: Point2D): Point2D => ({ x: a.x + b.x, y: a.y + b.y });

export const buildPatternContinuationPlacementMap = (
  project: Pick<Project, 'surfaces' | 'surfaceConnections'>,
): Map<string, PatternContinuationPlacement> => {
  const adjacency = new Map<string, ContinuationNeighbor[]>();
  for (const surface of project.surfaces) {
    adjacency.set(surface.id, []);
  }
  for (const connection of project.surfaceConnections) {
    if (!connection.allowPatternContinuation) continue;
    adjacency.get(connection.surfaceAId)?.push({
      nextSurfaceId: connection.surfaceBId,
      currentEdgeId: connection.edgeAId,
      nextEdgeId: connection.edgeBId,
    });
    adjacency.get(connection.surfaceBId)?.push({
      nextSurfaceId: connection.surfaceAId,
      currentEdgeId: connection.edgeBId,
      nextEdgeId: connection.edgeAId,
    });
  }

  const surfaceById = new Map(project.surfaces.map((surface) => [surface.id, surface]));
  const placements = new Map<string, PatternContinuationPlacement>();
  const visited = new Set<string>();

  for (const anchorSurface of project.surfaces) {
    if (visited.has(anchorSurface.id)) continue;

    const queue = [anchorSurface.id];
    const component: string[] = [];
    const relativeOffsets = new Map<string, Point2D>([[anchorSurface.id, { x: 0, y: 0 }]]);
    visited.add(anchorSurface.id);

    while (queue.length > 0) {
      const currentId = queue.shift();
      if (!currentId) continue;
      component.push(currentId);
      const currentSurface = surfaceById.get(currentId);
      const currentOffset = relativeOffsets.get(currentId) ?? { x: 0, y: 0 };
      if (!currentSurface) continue;

      for (const neighbor of adjacency.get(currentId) ?? []) {
        if (visited.has(neighbor.nextSurfaceId)) continue;
        const nextSurface = surfaceById.get(neighbor.nextSurfaceId);
        if (!nextSurface) continue;
        const currentMidpoint = edgeReferencePoint(currentSurface, neighbor.currentEdgeId);
        const nextMidpoint = edgeReferencePoint(nextSurface, neighbor.nextEdgeId);
        relativeOffsets.set(neighbor.nextSurfaceId, {
          x: currentOffset.x + currentMidpoint.x - nextMidpoint.x,
          y: currentOffset.y + currentMidpoint.y - nextMidpoint.y,
        });
        visited.add(neighbor.nextSurfaceId);
        queue.push(neighbor.nextSurfaceId);
      }
    }

    const hasContinuationChain = component.length > 1;
    const anchorPoint = anchorSurface.outerBoundary[0] ?? { x: 0, y: 0 };
    const originTranslation = hasContinuationChain
      ? { x: -anchorPoint.x, y: -anchorPoint.y }
      : { x: 0, y: 0 };

    for (const surfaceId of component) {
      const relativeOffset = relativeOffsets.get(surfaceId) ?? { x: 0, y: 0 };
      placements.set(surfaceId, {
        anchorSurfaceId: anchorSurface.id,
        virtualOffset: hasContinuationChain
          ? addPoints(relativeOffset, originTranslation)
          : { x: 0, y: 0 },
        originTranslation,
      });
    }
  }

  return placements;
};

export const buildPatternContinuationAnchorMap = (
  project: Pick<Project, 'surfaces' | 'surfaceConnections'>,
): Map<string, string> => {
  const anchors = new Map<string, string>();
  for (const [surfaceId, placement] of buildPatternContinuationPlacementMap(project)) {
    anchors.set(surfaceId, placement.anchorSurfaceId);
  }

  return anchors;
};
