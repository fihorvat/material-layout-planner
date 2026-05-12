import { useEffect, useState } from 'react';
import type { RefObject } from 'react';

export type Size = { width: number; height: number };

export const useResizeObserver = (ref: RefObject<HTMLElement | null>): Size => {
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      setSize({ width: el.clientWidth, height: el.clientHeight });
    };
    update();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }
    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
};
