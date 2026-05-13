import type Konva from 'konva';
import { useMeterDraw } from './meter/useMeterDraw';
import { MeterPreview } from './meter/MeterPreview';
import { useDrawingToolShell } from './useDrawingToolShell';

export const useMeterTool = (stageRef: React.RefObject<Konva.Stage | null>) => {
  const draw = useMeterDraw(stageRef);

  const { onStagePointerDown, onStagePointerMove } = useDrawingToolShell({
    cancel: draw.cancel,
    onPointerDown: draw.onPointerDown,
    onPointerMove: draw.onPointerMove,
  });

  const overlays =
    draw.state.phase === 'pickSecond' ? (
      <MeterPreview
        first={draw.state.first}
        cursor={draw.state.cursor}
        ortho={draw.state.ortho}
      />
    ) : null;

  return { onStagePointerDown, onStagePointerMove, overlays };
};
