import type Konva from 'konva';
import { usePolygonDraw } from './polygon/usePolygonDraw';
import { PolygonPreview } from './polygon/PolygonPreview';
import { NumericPromptOverlay } from './line/NumericPromptOverlay';
import { TypeLengthHint } from './TypeLengthHint';
import { numericTriggerChar } from './numericKeyTrigger';
import { useDrawingToolShell } from './useDrawingToolShell';

export const usePolygonTool = (stageRef: React.RefObject<Konva.Stage | null>) => {
  const draw = usePolygonDraw(stageRef);

  const { onStagePointerDown, onStagePointerMove } = useDrawingToolShell({
    cancel: draw.cancel,
    onPointerDown: draw.onPointerDown,
    onPointerMove: draw.onPointerMove,
    onKeyDown: (e) => {
      if (e.key === 'Enter') {
        draw.closeNow();
        return;
      }
      if (e.key === 'Backspace') {
        draw.removeLast();
        return;
      }
      const digit = numericTriggerChar(e);
      if (digit !== null && draw.state.phase === 'drawing' && !draw.numericPrompt) {
        e.preventDefault();
        draw.openNumericPrompt(digit);
      }
    },
  });

  const overlays =
    draw.state.phase === 'drawing' ? (
      <PolygonPreview
        points={draw.state.points}
        cursor={draw.state.cursor}
        ortho={draw.state.ortho}
        alignments={draw.state.alignments}
      />
    ) : null;

  const domOverlay = draw.numericPrompt ? (
    <NumericPromptOverlay
      onSubmit={draw.submitNumeric}
      onCancel={draw.cancelNumericPrompt}
      initialAngleDeg={draw.numericPrompt.initialAngleDeg}
      initialLength={draw.numericPrompt.initialLength}
    />
  ) : draw.state.phase === 'drawing' ? (
    <TypeLengthHint />
  ) : null;

  return { onStagePointerDown, onStagePointerMove, overlays, domOverlay, error: draw.error };
};
