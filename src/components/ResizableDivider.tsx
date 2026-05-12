import { useCallback, useRef } from 'react';
import styles from './controls.module.css';

export type ResizableDividerProps = {
  orientation: 'vertical' | 'horizontal';
  onResize: (deltaPx: number) => void;
  ariaLabel: string;
};

export const ResizableDivider = ({ orientation, onResize, ariaLabel }: ResizableDividerProps) => {
  const lastRef = useRef<number | null>(null);

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (lastRef.current == null) return;
      const current = orientation === 'vertical' ? e.clientX : e.clientY;
      const delta = current - lastRef.current;
      lastRef.current = current;
      onResize(delta);
    },
    [onResize, orientation],
  );

  const stop = useCallback(() => {
    lastRef.current = null;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', stop);
    document.body.style.cursor = '';
  }, [onPointerMove]);

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    lastRef.current = orientation === 'vertical' ? e.clientX : e.clientY;
    document.body.style.cursor = orientation === 'vertical' ? 'col-resize' : 'row-resize';
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', stop);
  };

  return (
    <div
      role="separator"
      aria-orientation={orientation}
      aria-label={ariaLabel}
      tabIndex={0}
      className={orientation === 'vertical' ? styles.dividerV : styles.dividerH}
      onPointerDown={onPointerDown}
    />
  );
};
