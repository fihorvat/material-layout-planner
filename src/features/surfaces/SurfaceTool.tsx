import { useEffect } from 'react';
import type Konva from 'konva';
import { PolygonPreview } from '@/features/drawingTools/polygon/PolygonPreview';
import { registerDrawingCancel } from '@/features/drawingTools/drawingCancelRegistry';
import { useSurfaceDraw } from './useSurfaceDraw';

export const useSurfaceTool = (stageRef: React.RefObject<Konva.Stage | null>) => {
  const draw = useSurfaceDraw(stageRef);

  useEffect(() => registerDrawingCancel(draw.cancel), [draw.cancel]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (e.key === 'Escape') draw.cancel();
      else if (e.key === 'Enter') draw.closeAsSurface();
      else if (e.key === 'Backspace') draw.removeLast();
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

  const overlays =
    draw.state.phase === 'drawing' ? (
      <PolygonPreview
        points={draw.state.points}
        cursor={draw.state.cursor}
        ortho={draw.state.ortho}
        alignments={draw.state.alignments}
      />
    ) : null;

  return { onStagePointerDown, onStagePointerMove, overlays, error: draw.error };
};
