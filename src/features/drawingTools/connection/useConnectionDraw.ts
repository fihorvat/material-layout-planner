import { useCallback, useState } from 'react';
import type Konva from 'konva';
import type { Point2D, Surface } from '@/types';
import {
  useConnectionToolStore,
  useEditorStore,
  useProjectStore,
} from '@/state';
import { screenToWorld } from '@/features/editor/canvas/coords';
import { closestEdgeOfPoints } from '@/domain/geometry';

export type ModifierKeys = { shift: boolean; alt: boolean; ctrl: boolean };

/** Hover state used by the preview overlay. */
export type ConnectionHover = {
  surfaceId: string;
  edgeIndex: number;
  midpoint: Point2D;
} | null;

const EDGE_PICK_TOL_PX = 14;

const resolveWorld = (stageRef: React.RefObject<Konva.Stage | null>): Point2D | null => {
  const s = stageRef.current;
  if (!s) return null;
  const pos = s.getPointerPosition();
  if (!pos) return null;
  const v = useEditorStore.getState().viewport;
  return screenToWorld(pos.x, pos.y, v);
};

const findNearestEdge = (
  cursor: Point2D,
  surfaces: Surface[],
  tolWorld: number,
  exclude?: { surfaceId: string; edgeIndex: number },
): ConnectionHover => {
  let best: { surface: Surface; edgeIndex: number; distance: number; projection: Point2D } | null = null;
  for (const surface of surfaces) {
    const edge = closestEdgeOfPoints(cursor, surface.outerBoundary, true);
    if (!edge) continue;
    if (
      exclude &&
      exclude.surfaceId === surface.id &&
      exclude.edgeIndex === edge.edgeIndex
    ) {
      continue;
    }
    if (edge.distance > tolWorld) continue;
    if (!best || edge.distance < best.distance) {
      best = {
        surface,
        edgeIndex: edge.edgeIndex,
        distance: edge.distance,
        projection: edge.projection,
      };
    }
  }
  if (!best) return null;
  return {
    surfaceId: best.surface.id,
    edgeIndex: best.edgeIndex,
    midpoint: best.projection,
  };
};

export const useConnectionDraw = (stageRef: React.RefObject<Konva.Stage | null>) => {
  const phase = useConnectionToolStore((s) => s.phase);
  const pickFirst = useConnectionToolStore((s) => s.pickFirst);
  const pickSecond = useConnectionToolStore((s) => s.pickSecond);
  const reset = useConnectionToolStore((s) => s.reset);

  const [hover, setHover] = useState<ConnectionHover>(null);
  const [error, setError] = useState<string | null>(null);

  const onPointerDown = useCallback(
    (_mods: ModifierKeys) => {
      void _mods;
      const raw = resolveWorld(stageRef);
      if (!raw) return;
      const v = useEditorStore.getState().viewport;
      const tolWorld = EDGE_PICK_TOL_PX / Math.max(v.scale, 1e-9);
      const surfaces = useProjectStore.getState().project.surfaces;

      if (phase.kind === 'pickA') {
        const hit = findNearestEdge(raw, surfaces, tolWorld);
        if (!hit) {
          setError('Click closer to a surface edge');
          return;
        }
        setError(null);
        pickFirst(hit.surfaceId, hit.edgeIndex);
        return;
      }
      if (phase.kind === 'pickB') {
        const hit = findNearestEdge(raw, surfaces, tolWorld, {
          surfaceId: phase.surfaceAId,
          edgeIndex: phase.edgeAIndex,
        });
        if (!hit) {
          setError('Click an edge of a different surface');
          return;
        }
        if (hit.surfaceId === phase.surfaceAId) {
          setError('Pick an edge on a different surface');
          return;
        }
        setError(null);
        pickSecond(hit.surfaceId, hit.edgeIndex);
      }
    },
    [stageRef, phase, pickFirst, pickSecond],
  );

  const onPointerMove = useCallback(() => {
    if (phase.kind === 'dialog') return;
    const raw = resolveWorld(stageRef);
    if (!raw) {
      setHover(null);
      return;
    }
    const v = useEditorStore.getState().viewport;
    const tolWorld = EDGE_PICK_TOL_PX / Math.max(v.scale, 1e-9);
    const surfaces = useProjectStore.getState().project.surfaces;
    const exclude =
      phase.kind === 'pickB' ? { surfaceId: phase.surfaceAId, edgeAIndex: phase.edgeAIndex } : undefined;
    setHover(
      findNearestEdge(raw, surfaces, tolWorld, exclude ? { surfaceId: exclude.surfaceId, edgeIndex: exclude.edgeAIndex } : undefined),
    );
  }, [stageRef, phase]);

  const cancel = useCallback(() => {
    setError(null);
    setHover(null);
    reset();
  }, [reset]);

  return { phase, hover, error, onPointerDown, onPointerMove, cancel };
};

export type UseConnectionDrawReturn = ReturnType<typeof useConnectionDraw>;
