import { useCallback, useRef, useState } from 'react';
import type Konva from 'konva';
import type { Point2D, DrawingEntity } from '@/types';
import { useEditorStore, useProjectStore, useSelectionStore } from '@/state';
import { screenToWorld } from '@/features/editor/canvas/coords';
import { hitTest, entitiesIntersectingAabb } from './HitTest';
import { dispatchCommand, deleteDrawingEntityCommand, addDrawingEntityCommand } from '@/domain/commands';
import { newDrawingEntityId } from '@/domain/ids';

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

  return {
    marquee,
    onStagePointerDown,
    onStagePointerMove,
    onStagePointerUp,
  };
};

export const deleteSelected = (): void => {
  const sel = useSelectionStore.getState().selected;
  const project = useProjectStore.getState().project;
  for (const entry of sel) {
    if (entry.kind === 'line' || entry.kind === 'rectangle' || entry.kind === 'polygon') {
      const exists = project.drawingEntities.some((e) => e.id === entry.id);
      if (exists) dispatchCommand(deleteDrawingEntityCommand({ id: entry.id }));
    }
  }
  useSelectionStore.getState().clear();
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
