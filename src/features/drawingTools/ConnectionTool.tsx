import { useEffect } from 'react';
import type Konva from 'konva';
import { useConnectionDraw } from './connection/useConnectionDraw';
import { ConnectionEdgePreview } from './connection/ConnectionEdgePreview';
import { registerDrawingCancel } from './drawingCancelRegistry';

export const useConnectionTool = (stageRef: React.RefObject<Konva.Stage | null>) => {
  const draw = useConnectionDraw(stageRef);

  useEffect(() => registerDrawingCancel(draw.cancel), [draw.cancel]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (e.key === 'Escape') draw.cancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [draw]);

  const onStagePointerDown = (e: { evt: MouseEvent }) => {
    if (e.evt.button !== 0) return;
    draw.onPointerDown({ shift: e.evt.shiftKey, alt: e.evt.altKey, ctrl: e.evt.ctrlKey });
  };
  const onStagePointerMove = (_e: { evt: MouseEvent }) => {
    void _e;
    draw.onPointerMove();
  };

  const overlays = <ConnectionEdgePreview phase={draw.phase} hover={draw.hover} />;

  return {
    onStagePointerDown,
    onStagePointerMove,
    overlays,
    error: draw.error,
    phase: draw.phase,
  };
};
