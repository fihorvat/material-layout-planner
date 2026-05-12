import { useCallback } from 'react';
import type Konva from 'konva';
import { usePolygonDraw } from '@/features/drawingTools/polygon/usePolygonDraw';
import { createSurface } from '@/domain/surfaces/createSurface';
import { useProjectStore } from '@/state';
import { dispatchCommand, createSurfaceCommand } from '@/domain/commands';

export const useSurfaceDraw = (stageRef: React.RefObject<Konva.Stage | null>) => {
  const draw = usePolygonDraw(stageRef);

  const closeAsSurface = useCallback(() => {
    if (draw.state.phase !== 'drawing') return;
    if (draw.state.points.length < 3) return;
    const baseName = `Surface ${useProjectStore.getState().project.surfaces.length + 1}`;
    const surface = createSurface({ name: baseName, outerBoundary: draw.state.points });
    dispatchCommand(createSurfaceCommand({ surface }));
    draw.cancel();
  }, [draw]);

  return { ...draw, closeAsSurface };
};
