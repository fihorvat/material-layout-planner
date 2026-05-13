import type Konva from 'konva';
import { useConnectionDraw } from './connection/useConnectionDraw';
import { ConnectionEdgePreview } from './connection/ConnectionEdgePreview';
import { useDrawingToolShell } from './useDrawingToolShell';

export const useConnectionTool = (stageRef: React.RefObject<Konva.Stage | null>) => {
  const draw = useConnectionDraw(stageRef);

  const { onStagePointerDown, onStagePointerMove } = useDrawingToolShell({
    cancel: draw.cancel,
    onPointerDown: draw.onPointerDown,
    // Connection tool doesn't consume pointer-move modifiers.
    onPointerMove: () => draw.onPointerMove(),
  });

  const overlays = <ConnectionEdgePreview phase={draw.phase} hover={draw.hover} />;

  return {
    onStagePointerDown,
    onStagePointerMove,
    overlays,
    error: draw.error,
    phase: draw.phase,
  };
};
