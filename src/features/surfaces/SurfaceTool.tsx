import type Konva from 'konva';
import { PolygonPreview } from '@/features/drawingTools/polygon/PolygonPreview';
import { NumericPromptOverlay } from '@/features/drawingTools/line/NumericPromptOverlay';
import { TypeLengthHint } from '@/features/drawingTools/TypeLengthHint';
import { numericTriggerChar } from '@/features/drawingTools/numericKeyTrigger';
import { useDrawingToolShell } from '@/features/drawingTools/useDrawingToolShell';
import { useSurfaceDraw } from './useSurfaceDraw';

export const useSurfaceTool = (stageRef: React.RefObject<Konva.Stage | null>) => {
  const draw = useSurfaceDraw(stageRef);

  const { onStagePointerDown, onStagePointerMove } = useDrawingToolShell({
    cancel: draw.cancel,
    onPointerDown: draw.onPointerDown,
    onPointerMove: draw.onPointerMove,
    onKeyDown: (e) => {
      if (e.key === 'Enter') {
        draw.closeAsSurface();
        return;
      }
      if (e.key === 'Backspace') {
        draw.removeLast();
        return;
      }
      // Open the numeric-length prompt on the first digit press so the
      // user can type "35cm" without "c" / "m" being swallowed by the
      // global tool-switch shortcuts.
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
