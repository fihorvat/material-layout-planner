import { useCallback, useState } from 'react';
import type Konva from 'konva';
import type {
  Point2D,
  Project,
  DrawingEntity,
  LineEntity,
  RectangleEntity,
  PolygonEntity,
} from '@/types';
import { useEditorStore, useProjectStore } from '@/state';
import { screenToWorld } from '@/features/editor/canvas/coords';
import { snap } from '@/features/editor/canvas/snap';
import {
  degToRad,
  distance,
  ensureCCW,
  segmentsIntersect,
} from '@/domain/geometry';
import { dispatchCommand, replaceProjectCommand } from '@/domain/commands';
import { newDrawingEntityId } from '@/domain/ids';

type CutDrawState =
  | { phase: 'pickFirst' }
  | { phase: 'pickSecond'; first: Point2D; cursor: Point2D };

export type ModifierKeys = { shift: boolean; alt: boolean; ctrl: boolean };

// Minimum distance between two distinct vertices we allow when splitting/
// inserting points on shape edges (mm). Avoids degenerate zero-length edges
// from cuts that graze a corner.
const VERTEX_EPSILON_MM = 1e-3;

const candidatePoints = (project: Project): Point2D[] => {
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

const resolveWorld = (
  stageRef: React.RefObject<Konva.Stage | null>,
  mods: ModifierKeys,
): Point2D | null => {
  const stage = stageRef.current;
  if (!stage) return null;
  const pos = stage.getPointerPosition();
  if (!pos) return null;
  const editor = useEditorStore.getState();
  const v = editor.viewport;
  const raw = screenToWorld(pos.x, pos.y, v);
  const project = useProjectStore.getState().project;
  const settings = project.settings;
  const snapEnabled = editor.snapEnabled && !mods.alt;
  const result = snap({
    worldPoint: raw,
    tolerancePx: editor.snapTolerancePx,
    scale: v.scale,
    gridSizeMm: settings.gridSizeMm,
    snapEnabled,
    snapModes: ['endpoint', 'point', 'grid'],
    candidatePoints: candidatePoints(project),
  });
  return result.point;
};

const rectCornersCCW = (rect: RectangleEntity): Point2D[] => {
  const rad = degToRad(rect.rotationDeg);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const w = rect.widthMm;
  const h = rect.heightMm;
  const local: Point2D[] = [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: w, y: h },
    { x: 0, y: h },
  ];
  const corners = local.map((p) => ({
    x: rect.origin.x + p.x * cos - p.y * sin,
    y: rect.origin.y + p.x * sin + p.y * cos,
  }));
  return ensureCCW(corners);
};

type RingInsertion = { edgeIndex: number; point: Point2D; tAlongEdge: number };

const collectRingHits = (
  ring: Point2D[],
  cutA: Point2D,
  cutB: Point2D,
): RingInsertion[] => {
  const n = ring.length;
  const out: RingInsertion[] = [];
  for (let i = 0; i < n; i++) {
    const a = ring[i]!;
    const b = ring[(i + 1) % n]!;
    const hit = segmentsIntersect(cutA, cutB, a, b);
    if (!hit) continue;
    if (distance(hit, a) < VERTEX_EPSILON_MM) continue;
    if (distance(hit, b) < VERTEX_EPSILON_MM) continue;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    const t = len < 1e-9 ? 0 : ((hit.x - a.x) * dx + (hit.y - a.y) * dy) / (len * len);
    out.push({ edgeIndex: i, point: hit, tAlongEdge: t });
  }
  return out;
};

const insertHitsIntoRing = (
  ring: Point2D[],
  hits: RingInsertion[],
): Point2D[] => {
  if (hits.length === 0) return ring;
  // Group hits by edgeIndex and sort within each edge by tAlongEdge ASC.
  const byEdge = new Map<number, RingInsertion[]>();
  for (const h of hits) {
    const arr = byEdge.get(h.edgeIndex) ?? [];
    arr.push(h);
    byEdge.set(h.edgeIndex, arr);
  }
  for (const arr of byEdge.values()) {
    arr.sort((x, y) => x.tAlongEdge - y.tAlongEdge);
  }
  const next: Point2D[] = [];
  for (let i = 0; i < ring.length; i++) {
    next.push(ring[i]!);
    const inserts = byEdge.get(i);
    if (inserts) {
      for (const h of inserts) {
        // Avoid duplicates within an edge (e.g. cut passing exactly through
        // a previously inserted point).
        const last = next[next.length - 1]!;
        if (distance(last, h.point) >= VERTEX_EPSILON_MM) {
          next.push(h.point);
        }
      }
    }
  }
  return next;
};

const applyCutToProject = (
  project: Project,
  cutA: Point2D,
  cutB: Point2D,
): { next: Project; changed: number } => {
  if (distance(cutA, cutB) < VERTEX_EPSILON_MM) {
    return { next: project, changed: 0 };
  }
  let changed = 0;
  const nextEntities: DrawingEntity[] = [];
  for (const entity of project.drawingEntities) {
    if (entity.type === 'line') {
      const hit = segmentsIntersect(cutA, cutB, entity.start, entity.end);
      if (
        !hit ||
        distance(hit, entity.start) < VERTEX_EPSILON_MM ||
        distance(hit, entity.end) < VERTEX_EPSILON_MM
      ) {
        nextEntities.push(entity);
        continue;
      }
      const partA: LineEntity = {
        ...entity,
        id: newDrawingEntityId(),
        start: entity.start,
        end: hit,
      };
      const partB: LineEntity = {
        ...entity,
        id: newDrawingEntityId(),
        start: hit,
        end: entity.end,
      };
      nextEntities.push(partA, partB);
      changed += 1;
      continue;
    }

    if (entity.type === 'rectangle') {
      const corners = rectCornersCCW(entity);
      const hits = collectRingHits(corners, cutA, cutB);
      if (hits.length === 0) {
        nextEntities.push(entity);
        continue;
      }
      const nextPoints = insertHitsIntoRing(corners, hits);
      if (nextPoints.length < 3) {
        nextEntities.push(entity);
        continue;
      }
      const replacement: PolygonEntity = {
        id: newDrawingEntityId(),
        type: 'polygon',
        points: nextPoints,
        name: entity.name,
        showSegmentDimensions: entity.showDimensions,
        showArea: false,
        style: entity.style,
      };
      nextEntities.push(replacement);
      changed += 1;
      continue;
    }

    if (entity.type === 'polygon') {
      const hits = collectRingHits(entity.points, cutA, cutB);
      if (hits.length === 0) {
        nextEntities.push(entity);
        continue;
      }
      const nextPoints = insertHitsIntoRing(entity.points, hits);
      if (nextPoints.length < 3) {
        nextEntities.push(entity);
        continue;
      }
      nextEntities.push({ ...entity, points: nextPoints });
      changed += 1;
      continue;
    }

    nextEntities.push(entity);
  }
  if (changed === 0) return { next: project, changed: 0 };
  return {
    next: { ...project, drawingEntities: nextEntities },
    changed,
  };
};

export const useCutDraw = (stageRef: React.RefObject<Konva.Stage | null>) => {
  const [state, setState] = useState<CutDrawState>({ phase: 'pickFirst' });

  const onPointerDown = useCallback(
    (mods: ModifierKeys) => {
      const point = resolveWorld(stageRef, mods);
      if (!point) return;
      if (state.phase === 'pickFirst') {
        setState({ phase: 'pickSecond', first: point, cursor: point });
        return;
      }
      // Second click: commit cut.
      const project = useProjectStore.getState().project;
      const { next, changed } = applyCutToProject(project, state.first, point);
      if (changed > 0) {
        dispatchCommand(
          replaceProjectCommand({ next }, `Cut (${changed} shape${changed > 1 ? 's' : ''})`),
        );
      }
      setState({ phase: 'pickFirst' });
    },
    [stageRef, state],
  );

  const onPointerMove = useCallback(
    (mods: ModifierKeys) => {
      if (state.phase !== 'pickSecond') return;
      const point = resolveWorld(stageRef, mods);
      if (!point) return;
      setState({ phase: 'pickSecond', first: state.first, cursor: point });
    },
    [stageRef, state],
  );

  const cancel = useCallback(() => {
    setState({ phase: 'pickFirst' });
  }, []);

  return { state, onPointerDown, onPointerMove, cancel };
};
