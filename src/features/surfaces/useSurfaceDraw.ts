import { useCallback } from 'react';
import type Konva from 'konva';
import type { Point2D } from '@/types';
import { usePolygonDraw } from '@/features/drawingTools/polygon/usePolygonDraw';
import { createSurface } from '@/domain/surfaces/createSurface';
import { useProjectStore } from '@/state';
import { dispatchCommand, createSurfaceCommand } from '@/domain/commands';

export const useSurfaceDraw = (stageRef: React.RefObject<Konva.Stage | null>) => {
  const commitSurface = useCallback((points: Point2D[]): boolean => {
    const baseName = `Surface ${useProjectStore.getState().project.surfaces.length + 1}`;
    const surface = createSurface({ name: baseName, outerBoundary: points });
    dispatchCommand(createSurfaceCommand({ surface }));
    return true;
  }, []);

  const draw = usePolygonDraw(stageRef, { onCommit: commitSurface });

  const closeAsSurface = useCallback(() => {
    if (draw.state.phase !== 'drawing') return;
    draw.closeNow();
  }, [draw]);

  return { ...draw, closeAsSurface };
};
