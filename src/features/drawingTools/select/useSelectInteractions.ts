import { useCallback, useRef, useState } from 'react';
import type Konva from 'konva';
import type {
  Point2D,
  DrawingEntity,
  LineEntity,
  PolygonEntity,
  RectangleEntity,
} from '@/types';
import { useEditorStore, useProjectStore, useSelectionStore } from '@/state';
import { screenToWorld } from '@/features/editor/canvas/coords';
import { hitTest, entitiesIntersectingAabb } from './HitTest';
import {
  dispatchCommand,
  deleteDrawingEntityCommand,
  addDrawingEntityCommand,
  splitLineCommand,
  replaceDrawingEntityCommand,
  updateDrawingEntityCommand,
  deleteSurfaceCommand,
  deleteDimensionCommand,
  deleteLabelCommand,
  removeOpeningCommand,
  findOpeningSurface,
} from '@/domain/commands';
import { newDrawingEntityId } from '@/domain/ids';
import {
  closestPointOnSegment,
  closestEdgeOfPoints,
  distance,
  degToRad,
  ensureCCW,
} from '@/domain/geometry';

const HIT_TOLERANCE_PX = 8;
const CLICK_DRAG_THRESHOLD_PX = 2;

type MarqueeState = {
  startWorld: Point2D;
  startScreen: Point2D;
  cursor: Point2D;
  shift: boolean;
  alt: boolean;
} | null;

export const useSelectInteractions = (stageRef: React.RefObject<Konva.Stage | null>) => {
  const [marquee, setMarquee] = useState<MarqueeState>(null);
  const isPanning = useRef(false);

  const onStagePointerDown = useCallback(
    (e: { evt: PointerEvent }) => {
      if (e.evt.button !== 0) return;
      const stage = stageRef.current;
      if (!stage) return;
      const pos = stage.getPointerPosition();
      if (!pos) return;
      const v = useEditorStore.getState().viewport;
      const world = screenToWorld(pos.x, pos.y, v);
      const layers = useEditorStore.getState().layers;
      const project = useProjectStore.getState().project;
      const tolMm = HIT_TOLERANCE_PX / v.scale;
      const result = hitTest({
        worldPoint: world,
        tolerancePxAsMm: tolMm,
        project,
        layers,
      });
      const sel = useSelectionStore.getState();
      const shift = e.evt.shiftKey;
      if (result.topHit) {
        if (shift) {
          sel.toggle({ kind: result.topHit.kind, id: result.topHit.id });
        } else {
          sel.select({ kind: result.topHit.kind, id: result.topHit.id });
        }
        return;
      }
      setMarquee({
        startWorld: world,
        startScreen: { x: pos.x, y: pos.y },
        cursor: world,
        shift,
        alt: e.evt.altKey,
      });
      if (!shift) sel.clear();
    },
    [stageRef],
  );

  const onStagePointerMove = useCallback(
    () => {
      if (!marquee || isPanning.current) return;
      const stage = stageRef.current;
      if (!stage) return;
      const pos = stage.getPointerPosition();
      if (!pos) return;
      const v = useEditorStore.getState().viewport;
      const world = screenToWorld(pos.x, pos.y, v);
      setMarquee({ ...marquee, cursor: world });
    },
    [marquee, stageRef],
  );

  const onStagePointerUp = useCallback(
    (e: { evt: PointerEvent }) => {
      if (!marquee) return;
      const stage = stageRef.current;
      if (!stage) return;
      const pos = stage.getPointerPosition();
      if (!pos) {
        setMarquee(null);
        return;
      }
      const dx = pos.x - marquee.startScreen.x;
      const dy = pos.y - marquee.startScreen.y;
      const moved = Math.hypot(dx, dy) > CLICK_DRAG_THRESHOLD_PX;
      if (!moved) {
        setMarquee(null);
        return;
      }
      const x1 = Math.min(marquee.startWorld.x, marquee.cursor.x);
      const x2 = Math.max(marquee.startWorld.x, marquee.cursor.x);
      const y1 = Math.min(marquee.startWorld.y, marquee.cursor.y);
      const y2 = Math.max(marquee.startWorld.y, marquee.cursor.y);
      const project = useProjectStore.getState().project;
      const hits = entitiesIntersectingAabb(
        project,
        { minX: x1, minY: y1, maxX: x2, maxY: y2 },
        e.evt.altKey,
      );
      const sel = useSelectionStore.getState();
      const next = hits.map((h) => ({ kind: h.kind, id: h.id }));
      if (marquee.shift) {
        for (const entry of next) sel.toggle(entry);
      } else {
        sel.selectMany(next);
      }
      setMarquee(null);
    },
    [marquee, stageRef],
  );

  const onStageDblClick = useCallback(
    (e: { evt: MouseEvent }) => {
      if (e.evt.button !== 0) return;
      const stage = stageRef.current;
      if (!stage) return;
      const pos = stage.getPointerPosition();
      if (!pos) return;
      const v = useEditorStore.getState().viewport;
      const world = screenToWorld(pos.x, pos.y, v);
      const layers = useEditorStore.getState().layers;
      const project = useProjectStore.getState().project;
      const tolMm = HIT_TOLERANCE_PX / v.scale;
      const result = hitTest({
        worldPoint: world,
        tolerancePxAsMm: tolMm,
        project,
        layers,
      });
      if (!result.topHit) return;
      const minGapMm = (HIT_TOLERANCE_PX / 2) / v.scale;

      if (result.topHit.kind === 'line') {
        const line = project.drawingEntities.find(
          (x) => x.id === result.topHit!.id && x.type === 'line',
        ) as LineEntity | undefined;
        if (!line) return;
        const onSeg = closestPointOnSegment(world, { a: line.start, b: line.end });
        if (
          distance(onSeg, line.start) < minGapMm ||
          distance(onSeg, line.end) < minGapMm
        ) {
          return;
        }
        const partA: LineEntity = {
          ...line,
          id: newDrawingEntityId(),
          start: line.start,
          end: onSeg,
        };
        const partB: LineEntity = {
          ...line,
          id: newDrawingEntityId(),
          start: onSeg,
          end: line.end,
        };
        dispatchCommand(
          splitLineCommand({ sourceId: line.id, parts: [partA, partB] }, 'Add point on line'),
        );
        useSelectionStore.getState().selectMany([
          { kind: 'line', id: partA.id },
          { kind: 'line', id: partB.id },
        ]);
        return;
      }

      if (result.topHit.kind === 'polygon') {
        const poly = project.drawingEntities.find(
          (x) => x.id === result.topHit!.id && x.type === 'polygon',
        ) as PolygonEntity | undefined;
        if (!poly) return;
        const edge = closestEdgeOfPoints(world, poly.points, true);
        if (!edge) return;
        const n = poly.points.length;
        const a = poly.points[edge.edgeIndex]!;
        const b = poly.points[(edge.edgeIndex + 1) % n]!;
        if (
          distance(edge.projection, a) < minGapMm ||
          distance(edge.projection, b) < minGapMm
        ) {
          return;
        }
        const nextPoints = [
          ...poly.points.slice(0, edge.edgeIndex + 1),
          edge.projection,
          ...poly.points.slice(edge.edgeIndex + 1),
        ];
        const patch: Partial<PolygonEntity> = { points: nextPoints };
        dispatchCommand(
          updateDrawingEntityCommand({ id: poly.id, patch }, 'Add point on polygon'),
        );
        useSelectionStore.getState().select({ kind: 'polygon', id: poly.id });
        return;
      }

      if (result.topHit.kind === 'rectangle') {
        const rect = project.drawingEntities.find(
          (x) => x.id === result.topHit!.id && x.type === 'rectangle',
        ) as RectangleEntity | undefined;
        if (!rect) return;
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
        const cornersRaw: Point2D[] = local.map((p) => ({
          x: rect.origin.x + p.x * cos - p.y * sin,
          y: rect.origin.y + p.x * sin + p.y * cos,
        }));
        const corners = ensureCCW(cornersRaw);
        const edge = closestEdgeOfPoints(world, corners, true);
        if (!edge) return;
        const cn = corners.length;
        const ca = corners[edge.edgeIndex]!;
        const cb = corners[(edge.edgeIndex + 1) % cn]!;
        if (
          distance(edge.projection, ca) < minGapMm ||
          distance(edge.projection, cb) < minGapMm
        ) {
          return;
        }
        const nextPoints = [
          ...corners.slice(0, edge.edgeIndex + 1),
          edge.projection,
          ...corners.slice(edge.edgeIndex + 1),
        ];
        const replacement: PolygonEntity = {
          id: newDrawingEntityId(),
          type: 'polygon',
          points: nextPoints,
          name: rect.name,
          showSegmentDimensions: rect.showDimensions,
          showArea: false,
          style: rect.style,
        };
        dispatchCommand(
          replaceDrawingEntityCommand(
            { sourceId: rect.id, replacement },
            'Add point on rectangle',
          ),
        );
        useSelectionStore.getState().select({ kind: 'polygon', id: replacement.id });
        return;
      }
    },
    [stageRef],
  );

  return {
    marquee,
    onStagePointerDown,
    onStagePointerMove,
    onStagePointerUp,
    onStageDblClick,
  };
};

export const deleteSelected = (): void => {
  const sel = useSelectionStore.getState().selected;
  const project = useProjectStore.getState().project;
  for (const entry of sel) {
    if (entry.kind === 'line' || entry.kind === 'rectangle' || entry.kind === 'polygon') {
      const exists = project.drawingEntities.some((e) => e.id === entry.id);
      if (exists) dispatchCommand(deleteDrawingEntityCommand({ id: entry.id }));
    } else if (entry.kind === 'surface') {
      const exists = project.surfaces.some((s) => s.id === entry.id);
      if (exists) dispatchCommand(deleteSurfaceCommand({ id: entry.id }));
    } else if (entry.kind === 'dimension') {
      const exists = project.dimensions.some((d) => d.id === entry.id);
      if (exists) dispatchCommand(deleteDimensionCommand({ id: entry.id }));
    } else if (entry.kind === 'label') {
      const exists = project.labels.some((l) => l.id === entry.id);
      if (exists) dispatchCommand(deleteLabelCommand({ id: entry.id }));
    } else if (entry.kind === 'opening') {
      const found = findOpeningSurface(project, entry.id);
      if (found) {
        dispatchCommand(removeOpeningCommand({ surfaceId: found.surface.id, openingId: entry.id }));
      }
    }
  }
  useSelectionStore.getState().clear();
};

export const selectAll = (): void => {
  const project = useProjectStore.getState().project;
  const layers = useEditorStore.getState().layers;
  const entries: { kind: 'line' | 'rectangle' | 'polygon' | 'surface' | 'opening' | 'dimension' | 'label'; id: string }[] = [];

  if (layers.construction.visible && !layers.construction.locked) {
    for (const e of project.drawingEntities) {
      entries.push({ kind: e.type, id: e.id });
    }
  }
  if (layers.surfaces.visible && !layers.surfaces.locked) {
    for (const s of project.surfaces) {
      entries.push({ kind: 'surface', id: s.id });
    }
  }
  if (layers.openings.visible && !layers.openings.locked) {
    for (const s of project.surfaces) {
      for (let i = 0; i < s.holes.length; i++) {
        const meta = s.holeMeta[i];
        const id = meta?.id ?? `${s.id}:hole:${i}`;
        entries.push({ kind: 'opening', id });
      }
    }
  }
  if (layers.dimensions.visible && !layers.dimensions.locked) {
    for (const d of project.dimensions) {
      entries.push({ kind: 'dimension', id: d.id });
    }
  }
  if (layers.labels.visible && !layers.labels.locked) {
    for (const l of project.labels) {
      entries.push({ kind: 'label', id: l.id });
    }
  }

  useSelectionStore.getState().selectMany(entries);
};

export const duplicateSelected = (offsetMm = 10): void => {
  const sel = useSelectionStore.getState().selected;
  const project = useProjectStore.getState().project;
  for (const entry of sel) {
    if (entry.kind !== 'line' && entry.kind !== 'rectangle' && entry.kind !== 'polygon') continue;
    const e = project.drawingEntities.find((x) => x.id === entry.id);
    if (!e) continue;
    let copy: DrawingEntity;
    if (e.type === 'line') {
      copy = {
        ...e,
        id: newDrawingEntityId(),
        start: { x: e.start.x + offsetMm, y: e.start.y + offsetMm },
        end: { x: e.end.x + offsetMm, y: e.end.y + offsetMm },
      };
    } else if (e.type === 'rectangle') {
      copy = {
        ...e,
        id: newDrawingEntityId(),
        origin: { x: e.origin.x + offsetMm, y: e.origin.y + offsetMm },
      };
    } else {
      copy = {
        ...e,
        id: newDrawingEntityId(),
        points: e.points.map((p) => ({ x: p.x + offsetMm, y: p.y + offsetMm })),
      };
    }
    dispatchCommand(addDrawingEntityCommand({ entity: copy }));
  }
};
