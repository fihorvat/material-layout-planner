import { useEffect } from 'react';
import type Konva from 'konva';
import { useMeterDraw } from './meter/useMeterDraw';
import { MeterPreview } from './meter/MeterPreview';
import { registerDrawingCancel } from './drawingCancelRegistry';

export const useMeterTool = (stageRef: React.RefObject<Konva.Stage | null>) => {
  const draw = useMeterDraw(stageRef);

  useEffect(() => registerDrawingCancel(draw.cancel), [draw.cancel]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }
      if (e.key === 'Escape') {
        draw.cancel();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [draw]);

  const onStagePointerDown = (e: { evt: PointerEvent | MouseEvent }) => {
    if ((e.evt as MouseEvent).button !== 0) return;
    draw.onPointerDown({ shift: e.evt.shiftKey, alt: e.evt.altKey, ctrl: e.evt.ctrlKey });
  };
  const onStagePointerMove = (e: { evt: PointerEvent | MouseEvent }) => {
    draw.onPointerMove({ shift: e.evt.shiftKey, alt: e.evt.altKey, ctrl: e.evt.ctrlKey });
  };

  const overlays =
    draw.state.phase === 'pickSecond' ? (
      <MeterPreview
        first={draw.state.first}
        cursor={draw.state.cursor}
        snappedToEdge={draw.state.snappedToEdge}
      />
    ) : null;

  return { onStagePointerDown, onStagePointerMove, overlays };
};
