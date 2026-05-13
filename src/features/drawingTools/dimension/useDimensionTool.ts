import { useCallback } from 'react';
import type Konva from 'konva';
import { useEditorStore, useProjectStore } from '@/state';
import { screenToWorld } from '@/features/editor/canvas/coords';
import { hitTest } from '@/features/drawingTools/select/HitTest';
import {
  dispatchCommand,
  updateDrawingEntityCommand,
  updateSurfaceCommand,
} from '@/domain/commands';

const HIT_TOLERANCE_PX = 8;

export const useDimensionTool = (stageRef: React.RefObject<Konva.Stage | null>) => {
  const onStagePointerDown = useCallback(
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
      const hit = result.topHit;
      if (!hit) return;
      if (hit.kind === 'line') {
        const ent = project.drawingEntities.find((x) => x.id === hit.id);
        if (!ent || ent.type !== 'line') return;
        dispatchCommand(
          updateDrawingEntityCommand({
            id: ent.id,
            patch: { showDimension: !ent.showDimension },
          }),
        );
      } else if (hit.kind === 'rectangle') {
        const ent = project.drawingEntities.find((x) => x.id === hit.id);
        if (!ent || ent.type !== 'rectangle') return;
        dispatchCommand(
          updateDrawingEntityCommand({
            id: ent.id,
            patch: { showDimensions: !ent.showDimensions },
          }),
        );
      } else if (hit.kind === 'polygon') {
        const ent = project.drawingEntities.find((x) => x.id === hit.id);
        if (!ent || ent.type !== 'polygon') return;
        dispatchCommand(
          updateDrawingEntityCommand({
            id: ent.id,
            patch: { showSegmentDimensions: !ent.showSegmentDimensions },
          }),
        );
      } else if (hit.kind === 'surface') {
        const s = project.surfaces.find((x) => x.id === hit.id);
        if (!s) return;
        dispatchCommand(
          updateSurfaceCommand({
            id: s.id,
            patch: { showDimensions: !s.showDimensions },
          }),
        );
      }
    },
    [stageRef],
  );

  return { onStagePointerDown };
};
