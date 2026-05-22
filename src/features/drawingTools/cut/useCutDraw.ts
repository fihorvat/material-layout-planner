import { useCallback, useState } from 'react';
import type Konva from 'konva';
import type {
  Point2D,
  Project,
  LineEntity,
  RectangleEntity,
  PolygonEntity,
  Surface,
} from '@/types';
import { useEditorStore, useProjectStore } from '@/state';
import {
  closestEdgeOfPoints,
  closestPointOnSegment,
  distance,
  ensureCCW,
  rectangleToPoints,
} from '@/domain/geometry';
import { resolveWorldFromStage } from '@/features/drawingTools/drawingCoords';
import { dispatchCommand, replaceProjectCommand } from '@/domain/commands';
import { newDrawingEntityId } from '@/domain/ids';

type CutCandidate =
  | {
      kind: 'line';
      entityId: string;
      point: Point2D;
      edge: { a: Point2D; b: Point2D };
      distanceMm: number;
    }
  | {
      kind: 'polygon';
      entityId: string;
      edgeIndex: number;
      point: Point2D;
      edge: { a: Point2D; b: Point2D };
      distanceMm: number;
    }
  | {
      kind: 'rectangle';
      entityId: string;
      edgeIndex: number;
      point: Point2D;
      edge: { a: Point2D; b: Point2D };
      distanceMm: number;
    }
  | {
      kind: 'surface';
      surfaceId: string;
      edgeIndex: number;
      point: Point2D;
      edge: { a: Point2D; b: Point2D };
      distanceMm: number;
    }
  | {
      kind: 'opening';
      surfaceId: string;
      openingId: string;
      edgeIndex: number;
      point: Point2D;
      edge: { a: Point2D; b: Point2D };
      distanceMm: number;
    };

type CutDrawState = { candidate: CutCandidate | null };

export type ModifierKeys = { shift: boolean; alt: boolean; ctrl: boolean };

// Minimum distance between two distinct vertices we allow when inserting
// points on shape edges (mm). Avoids degenerate zero-length edges when the
// click lands effectively on an existing vertex.
const VERTEX_EPSILON_MM = 1e-3;
const CUT_TOLERANCE_PX = 12;

const resolveWorld = (
  stageRef: React.RefObject<Konva.Stage | null>,
): Point2D | null => {
  return resolveWorldFromStage(stageRef);
};

const rectCornersCCW = (rect: RectangleEntity): Point2D[] =>
  ensureCCW(rectangleToPoints(rect.origin, rect.widthMm, rect.heightMm, rect.rotationDeg));

const insertPointOnRing = (ring: Point2D[], edgeIndex: number, point: Point2D): Point2D[] => [
  ...ring.slice(0, edgeIndex + 1),
  point,
  ...ring.slice(edgeIndex + 1),
];

const tryRingCandidate = (
  ring: Point2D[],
  world: Point2D,
  toleranceMm: number,
): { edgeIndex: number; point: Point2D; edge: { a: Point2D; b: Point2D }; distanceMm: number } | null => {
  const edge = closestEdgeOfPoints(world, ring, true);
  if (!edge || edge.distance > toleranceMm) return null;
  const a = ring[edge.edgeIndex]!;
  const b = ring[(edge.edgeIndex + 1) % ring.length]!;
  if (
    distance(edge.projection, a) < VERTEX_EPSILON_MM ||
    distance(edge.projection, b) < VERTEX_EPSILON_MM
  ) {
    return null;
  }
  return {
    edgeIndex: edge.edgeIndex,
    point: edge.projection,
    edge: { a, b },
    distanceMm: edge.distance,
  };
};

const pickBetterCandidate = (best: CutCandidate | null, next: CutCandidate | null): CutCandidate | null => {
  if (!next) return best;
  if (!best || next.distanceMm < best.distanceMm) return next;
  return best;
};

const resolveCandidate = (project: Project, world: Point2D): CutCandidate | null => {
  const toleranceMm = CUT_TOLERANCE_PX / Math.max(useEditorStore.getState().viewport.scale, 1e-9);
  let best: CutCandidate | null = null;

  for (const entity of project.drawingEntities) {
    if (entity.type === 'line') {
      const point = closestPointOnSegment(world, { a: entity.start, b: entity.end });
      const dist = distance(world, point);
      if (
        dist <= toleranceMm &&
        distance(point, entity.start) >= VERTEX_EPSILON_MM &&
        distance(point, entity.end) >= VERTEX_EPSILON_MM
      ) {
        best = pickBetterCandidate(best, {
          kind: 'line',
          entityId: entity.id,
          point,
          edge: { a: entity.start, b: entity.end },
          distanceMm: dist,
        });
      }
      continue;
    }

    if (entity.type === 'rectangle') {
      const hit = tryRingCandidate(rectCornersCCW(entity), world, toleranceMm);
      best = pickBetterCandidate(
        best,
        hit
          ? {
              kind: 'rectangle',
              entityId: entity.id,
              edgeIndex: hit.edgeIndex,
              point: hit.point,
              edge: hit.edge,
              distanceMm: hit.distanceMm,
            }
          : null,
      );
      continue;
    }

    if (entity.type === 'polygon') {
      const hit = tryRingCandidate(entity.points, world, toleranceMm);
      best = pickBetterCandidate(
        best,
        hit
          ? {
              kind: 'polygon',
              entityId: entity.id,
              edgeIndex: hit.edgeIndex,
              point: hit.point,
              edge: hit.edge,
              distanceMm: hit.distanceMm,
            }
          : null,
      );
    }
  }

  for (const surface of project.surfaces) {
    const surfaceHit = tryRingCandidate(surface.outerBoundary, world, toleranceMm);
    best = pickBetterCandidate(
      best,
      surfaceHit
        ? {
            kind: 'surface',
            surfaceId: surface.id,
            edgeIndex: surfaceHit.edgeIndex,
            point: surfaceHit.point,
            edge: surfaceHit.edge,
            distanceMm: surfaceHit.distanceMm,
          }
        : null,
    );

    for (let index = 0; index < surface.holes.length; index += 1) {
      const openingId = surface.holeMeta[index]?.id;
      const hole = surface.holes[index];
      if (!openingId || !hole) continue;
      const openingHit = tryRingCandidate(hole, world, toleranceMm);
      best = pickBetterCandidate(
        best,
        openingHit
          ? {
              kind: 'opening',
              surfaceId: surface.id,
              openingId,
              edgeIndex: openingHit.edgeIndex,
              point: openingHit.point,
              edge: openingHit.edge,
              distanceMm: openingHit.distanceMm,
            }
          : null,
      );
    }
  }

  return best;
};

const updateSurfaceBoundary = (surface: Surface, edgeIndex: number, point: Point2D): Surface => ({
  ...surface,
  outerBoundary: insertPointOnRing(surface.outerBoundary, edgeIndex, point),
});

export const applyCutCandidateToProject = (
  project: Project,
  candidate: CutCandidate,
): { next: Project; label: string } => {
  if (candidate.kind === 'line') {
    const nextEntities = project.drawingEntities.flatMap((entity) => {
      if (entity.id !== candidate.entityId || entity.type !== 'line') return [entity];
      const partA: LineEntity = {
        ...entity,
        id: newDrawingEntityId(),
        end: candidate.point,
      };
      const partB: LineEntity = {
        ...entity,
        id: newDrawingEntityId(),
        start: candidate.point,
      };
      return [partA, partB];
    });
    return {
      next: { ...project, drawingEntities: nextEntities },
      label: 'Add point on line',
    };
  }

  if (candidate.kind === 'polygon') {
    const nextEntities = project.drawingEntities.map((entity) =>
      entity.id === candidate.entityId && entity.type === 'polygon'
        ? { ...entity, points: insertPointOnRing(entity.points, candidate.edgeIndex, candidate.point) }
        : entity,
    );
    return {
      next: { ...project, drawingEntities: nextEntities },
      label: 'Add point on polygon',
    };
  }

  if (candidate.kind === 'rectangle') {
    const nextEntities = project.drawingEntities.map((entity) => {
      if (entity.id !== candidate.entityId || entity.type !== 'rectangle') return entity;
      const replacement: PolygonEntity = {
        id: newDrawingEntityId(),
        type: 'polygon',
        points: insertPointOnRing(rectCornersCCW(entity), candidate.edgeIndex, candidate.point),
        name: entity.name,
        showSegmentDimensions: entity.showDimensions,
        showArea: false,
        style: entity.style,
      };
      return replacement;
    });
    return {
      next: { ...project, drawingEntities: nextEntities },
      label: 'Add point on rectangle',
    };
  }

  if (candidate.kind === 'surface') {
    return {
      next: {
        ...project,
        surfaces: project.surfaces.map((surface) =>
          surface.id === candidate.surfaceId
            ? updateSurfaceBoundary(surface, candidate.edgeIndex, candidate.point)
            : surface,
        ),
      },
      label: 'Add point on surface',
    };
  }

  return {
    next: {
      ...project,
      surfaces: project.surfaces.map((surface) => {
        if (surface.id !== candidate.surfaceId) return surface;
        return {
          ...surface,
          holes: surface.holes.map((hole, index) =>
            surface.holeMeta[index]?.id === candidate.openingId
              ? insertPointOnRing(hole, candidate.edgeIndex, candidate.point)
              : hole,
          ),
        };
      }),
    },
    label: 'Add point on opening',
  };
};

export const useCutDraw = (stageRef: React.RefObject<Konva.Stage | null>) => {
  const [state, setState] = useState<CutDrawState>({ candidate: null });

  const onPointerDown = useCallback(
    (_mods: ModifierKeys) => {
      const point = resolveWorld(stageRef);
      if (!point) return;
      const project = useProjectStore.getState().project;
      const candidate = resolveCandidate(project, point);
      if (!candidate) return;
      const { next, label } = applyCutCandidateToProject(project, candidate);
      dispatchCommand(replaceProjectCommand({ next }, label));
      setState({ candidate: resolveCandidate(next, point) });
    },
    [stageRef],
  );

  const onPointerMove = useCallback(
    (_mods: ModifierKeys) => {
      const point = resolveWorld(stageRef);
      if (!point) return;
      const project = useProjectStore.getState().project;
      setState({ candidate: resolveCandidate(project, point) });
    },
    [stageRef],
  );

  const cancel = useCallback(() => {
    setState({ candidate: null });
  }, []);

  return { state, onPointerDown, onPointerMove, cancel };
};
