import { useEffect } from 'react';
import type Konva from 'konva';
import { usePolygonDraw } from './polygon/usePolygonDraw';
import { PolygonPreview } from './polygon/PolygonPreview';

export const usePolygonTool = (stageRef: React.RefObject<Konva.Stage | null>) => {
  const draw = usePolygonDraw(stageRef);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (e.key === 'Escape') draw.cancel();
      else if (e.key === 'Enter') draw.closeNow();
      else if (e.key === 'Backspace') draw.removeLast();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [draw]);

  const onStagePointerDown = (e: { evt: MouseEvent }) => {
    if (e.evt.button !== 0) return;
    draw.onPointerDown();
  };
  const onStagePointerMove = () => draw.onPointerMove();

  const overlays =
    draw.state.phase === 'drawing' ? (
      <PolygonPreview points={draw.state.points} cursor={draw.state.cursor} />
    ) : null;

  return { onStagePointerDown, onStagePointerMove, overlays, error: draw.error };
};
