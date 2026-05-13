import { useEffect } from 'react';
import type Konva from 'konva';
import { useOpeningDraw } from './opening/useOpeningDraw';
import { OpeningRectPreview, OpeningPolyPreview } from './opening/OpeningPreview';
import { RectangleNumericPromptOverlay } from './rectangle/RectangleNumericPromptOverlay';
import { NumericPromptOverlay } from './line/NumericPromptOverlay';
import { TypeLengthHint } from './TypeLengthHint';
import { numericTriggerChar } from './numericKeyTrigger';
import { registerDrawingCancel } from './drawingCancelRegistry';

export const useOpeningTool = (stageRef: React.RefObject<Konva.Stage | null>) => {
  const draw = useOpeningDraw(stageRef);

  useEffect(() => registerDrawingCancel(draw.cancel), [draw.cancel]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (e.key === 'Escape') {
        draw.cancel();
        return;
      }
      if (e.key === 'Enter' && draw.mode === 'polygon') {
        draw.closePolygonNow();
        return;
      }
      if (e.key === 'Backspace') {
        if (draw.mode === 'polygon') draw.removeLastPolygonVertex();
        else if (draw.mode === 'rectangle') draw.removeLastRectPoint();
        return;
      }
      // Open the numeric-length prompt on the first digit press so the
      // user can type e.g. "37cm" without "c" / "m" being swallowed by
      // global tool-switch shortcuts. Matches the rectangle/polygon tool.
      const digit = numericTriggerChar(e);
      if (digit !== null && !draw.numericPrompt) {
        const canPrompt =
          (draw.mode === 'rectangle' && draw.state.phase === 'rectPickSecond') ||
          (draw.mode === 'polygon' && draw.state.phase === 'polyDrawing');
        if (canPrompt) {
          e.preventDefault();
          draw.openNumericPrompt(digit);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [draw]);

  const onStagePointerDown = (e: { evt: MouseEvent }) => {
    if (e.evt.button !== 0) return;
    draw.onPointerDown({ shift: e.evt.shiftKey, alt: e.evt.altKey, ctrl: e.evt.ctrlKey });
  };
  const onStagePointerMove = (e: { evt: MouseEvent }) => {
    draw.onPointerMove({ shift: e.evt.shiftKey, alt: e.evt.altKey, ctrl: e.evt.ctrlKey });
  };

  let overlay: React.ReactNode = null;
  if (draw.state.phase === 'rectPickSecond' && draw.rectPreview) {
    overlay = (
      <OpeningRectPreview
        origin={draw.rectPreview.origin}
        widthMm={draw.rectPreview.widthMm}
        heightMm={draw.rectPreview.heightMm}
        cursor={draw.state.cursor}
      />
    );
  } else if (draw.state.phase === 'polyDrawing') {
    overlay = (
      <OpeningPolyPreview
        points={draw.state.points}
        cursor={draw.state.cursor}
        ortho={draw.state.ortho}
        alignments={draw.state.alignments}
      />
    );
  }

  let domOverlay: React.ReactNode = null;
  if (draw.numericPrompt?.kind === 'rect') {
    domOverlay = (
      <RectangleNumericPromptOverlay
        onSubmit={(w, h) => draw.submitNumericRect(w, h)}
        onCancel={draw.cancelNumericPrompt}
        initialLength={draw.numericPrompt.initialLength}
      />
    );
  } else if (draw.numericPrompt?.kind === 'poly') {
    domOverlay = (
      <NumericPromptOverlay
        onSubmit={draw.submitNumericPoly}
        onCancel={draw.cancelNumericPrompt}
        initialAngleDeg={draw.numericPrompt.initialAngleDeg}
        initialLength={draw.numericPrompt.initialLength}
      />
    );
  } else if (
    draw.state.phase === 'rectPickSecond' ||
    draw.state.phase === 'polyDrawing'
  ) {
    domOverlay = <TypeLengthHint />;
  }

  return {
    onStagePointerDown,
    onStagePointerMove,
    overlays: overlay,
    domOverlay,
    mode: draw.mode,
    commitFromSelection: draw.commitFromSelection,
  };
};

export type UseOpeningToolReturn = ReturnType<typeof useOpeningTool>;
