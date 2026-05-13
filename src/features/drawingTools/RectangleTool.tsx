import type Konva from 'konva';
import { useRectangleDraw } from './rectangle/useRectangleDraw';
import { RectanglePreview } from './rectangle/RectanglePreview';
import { RectangleNumericPromptOverlay } from './rectangle/RectangleNumericPromptOverlay';
import { TypeLengthHint } from './TypeLengthHint';
import { numericTriggerChar } from './numericKeyTrigger';
import { useDrawingToolShell } from './useDrawingToolShell';

export const useRectangleTool = (stageRef: React.RefObject<Konva.Stage | null>) => {
  const draw = useRectangleDraw(stageRef);

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
      const digit = numericTriggerChar(e);
      if (digit !== null && draw.state.phase === 'pickSecond' && !draw.numericPrompt) {
        e.preventDefault();
        draw.openNumericPrompt(digit);
      }
    },
  });

  const overlays = draw.preview ? (
    <RectanglePreview
      origin={draw.preview.origin}
      widthMm={draw.preview.widthMm}
      heightMm={draw.preview.heightMm}
      cursor={draw.state.phase === 'pickSecond' ? draw.state.cursor : undefined}
    />
  ) : null;

  const domOverlay = draw.numericPrompt ? (
    <RectangleNumericPromptOverlay
      onSubmit={(w, h) => draw.submitNumeric(w, h)}
      onCancel={draw.cancel}
      initialLength={draw.numericPrompt.initialLength}
    />
  ) : draw.state.phase === 'pickSecond' ? (
    <TypeLengthHint />
  ) : null;

  return { onStagePointerDown, onStagePointerMove, overlays, domOverlay };
};
