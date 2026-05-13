import type Konva from 'konva';
import { useLineDraw } from './line/useLineDraw';
import { LinePreview } from './line/LinePreview';
import { NumericPromptOverlay } from './line/NumericPromptOverlay';
import { TypeLengthHint } from './TypeLengthHint';
import { numericTriggerChar } from './numericKeyTrigger';
import { useDrawingToolShell } from './useDrawingToolShell';

export const useLineTool = (stageRef: React.RefObject<Konva.Stage | null>) => {
  const draw = useLineDraw(stageRef);

  const { onStagePointerDown, onStagePointerMove } = useDrawingToolShell({
    cancel: draw.cancel,
    onPointerDown: draw.onPointerDown,
    onPointerMove: draw.onPointerMove,
    onKeyDown: (e) => {
      if (e.key === 'Backspace' && draw.state.phase === 'pickSecond') {
        e.preventDefault();
        draw.removeLast();
        return;
      }
      // Detect digits via physical key code so Shift (used for ortho lock)
      // and non-Latin layouts don't block the numeric prompt.
      const digit = numericTriggerChar(e);
      if (digit !== null && draw.state.phase === 'pickSecond' && !draw.numericPrompt) {
        // Prefill the prompt with the digit the user just pressed so they
        // don't have to retype it. preventDefault stops the browser from
        // also inserting the digit into the newly-focused input, which
        // would otherwise duplicate it (e.g. "24" -> "224").
        e.preventDefault();
        draw.openNumericPrompt(digit);
      }
    },
  });

  const overlays =
    draw.state.phase === 'pickSecond' ? (
      <LinePreview first={draw.state.first} cursor={draw.state.cursor} ortho={draw.state.ortho} />
    ) : null;

  const domOverlay = draw.numericPrompt ? (
    <NumericPromptOverlay
      onSubmit={draw.submitNumeric}
      onCancel={draw.cancel}
      initialAngleDeg={draw.numericPrompt.initialAngleDeg}
      initialLength={draw.numericPrompt.initialLength}
    />
  ) : draw.state.phase === 'pickSecond' ? (
    <TypeLengthHint />
  ) : null;

  return { onStagePointerDown, onStagePointerMove, overlays, domOverlay };
};
