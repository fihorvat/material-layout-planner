import type Konva from 'konva';
import { useCutDraw } from './cut/useCutDraw';
import { CutPreview } from './cut/CutPreview';
import { useDrawingToolShell } from './useDrawingToolShell';

export const useCutTool = (stageRef: React.RefObject<Konva.Stage | null>) => {
  const draw = useCutDraw(stageRef);

  const { onStagePointerDown, onStagePointerMove } = useDrawingToolShell({
    cancel: draw.cancel,
    onPointerDown: draw.onPointerDown,
    onPointerMove: draw.onPointerMove,
  });

  const overlays =
    draw.state.candidate ? (
      <CutPreview edge={draw.state.candidate.edge} point={draw.state.candidate.point} />
    ) : null;

  return { onStagePointerDown, onStagePointerMove, overlays };
};
