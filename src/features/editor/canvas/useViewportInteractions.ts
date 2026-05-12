import { useEffect, useRef } from 'react';
import type Konva from 'konva';
import { useEditorStore, clampZoom } from '@/state';

type StageEventTarget = Konva.Stage | null;

export const useViewportInteractions = (stageRef: React.RefObject<StageEventTarget>) => {
  const setViewport = useEditorStore((s) => s.setViewport);
  const zoomAt = useEditorStore((s) => s.zoomAt);
  const panBy = useEditorStore((s) => s.panBy);
  const resetViewport = useEditorStore((s) => s.resetViewport);
  const spaceHeld = useRef(false);
  const panning = useRef(false);
  const lastPointer = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (e.code === 'Space') {
        spaceHeld.current = true;
        document.body.style.cursor = 'grab';
      } else if (e.key === '+' || e.key === '=') {
        const s = stageRef.current;
        if (s) {
          zoomAt({ x: s.width() / 2, y: s.height() / 2 }, 1.2);
        }
      } else if (e.key === '-' || e.key === '_') {
        const s = stageRef.current;
        if (s) {
          zoomAt({ x: s.width() / 2, y: s.height() / 2 }, 1 / 1.2);
        }
      } else if (e.key === '0') {
        const v = useEditorStore.getState().viewport;
        setViewport({ ...v, scale: clampZoom(1) });
      } else if (e.key === 'Home') {
        resetViewport();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spaceHeld.current = false;
        document.body.style.cursor = '';
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [setViewport, zoomAt, resetViewport, stageRef]);

  const onWheel = (e: { evt: WheelEvent }) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const factor = Math.exp(-e.evt.deltaY * 0.0015);
    zoomAt(pointer, factor);
  };

  const onMouseDown = (e: { evt: MouseEvent }) => {
    if (e.evt.button === 1 || (e.evt.button === 0 && spaceHeld.current)) {
      panning.current = true;
      lastPointer.current = { x: e.evt.clientX, y: e.evt.clientY };
      document.body.style.cursor = 'grabbing';
    }
  };
  const onMouseMove = (e: { evt: MouseEvent }) => {
    if (!panning.current || !lastPointer.current) return;
    const dx = e.evt.clientX - lastPointer.current.x;
    const dy = e.evt.clientY - lastPointer.current.y;
    lastPointer.current = { x: e.evt.clientX, y: e.evt.clientY };
    panBy(dx, dy);
  };
  const onMouseUp = () => {
    panning.current = false;
    lastPointer.current = null;
    document.body.style.cursor = spaceHeld.current ? 'grab' : '';
  };

  return { onWheel, onMouseDown, onMouseMove, onMouseUp };
};
