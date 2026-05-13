import type Konva from 'konva';
import { SplitPreview } from './split/SplitPreview';
import { SplitDimensionPrompt } from './split/SplitDimensionPrompt';
import { useSplitSurfaceDraw } from './split/useSplitSurfaceDraw';
import { useDrawingToolShell } from '@/features/drawingTools/useDrawingToolShell';

export const useSplitSurfaceTool = (stageRef: React.RefObject<Konva.Stage | null>) => {
  const draw = useSplitSurfaceDraw(stageRef);

  const { onStagePointerDown, onStagePointerMove } = useDrawingToolShell({
    cancel: draw.cancel,
    onPointerDown: draw.onPointerDown,
    onPointerMove: draw.onPointerMove,
    onKeyDown: (e) => {
      if (e.key === 'Enter' && draw.state.phase === 'polyDrawing') {
        draw.closePolygonNow();
        return;
      }
      if (e.key === 'Backspace') {
        if (
          draw.state.phase === 'polyDrawing' ||
          draw.state.phase === 'linePickB' ||
          draw.state.phase === 'rectPickB'
        ) {
          e.preventDefault();
          draw.removeLastPoint();
        }
      }
    },
  });

  const overlays = <SplitPreview state={draw.state} surface={draw.targetSurface} />;

  const domOverlay = (
    <SplitDimensionPrompt
      onSubmit={({ surfaceId, edgeIndex, offsetMm }) =>
        draw.applyDimensionSplit(surfaceId, edgeIndex, offsetMm)
      }
    />
  );

  return {
    onStagePointerDown,
    onStagePointerMove,
    overlays,
    domOverlay,
    error: draw.error,
    targetSurface: draw.targetSurface,
  };
};
