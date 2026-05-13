import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import styles from './controls.module.css';

export type TooltipProps = {
  label: string;
  shortcut?: string;
  delayMs?: number;
  children: ReactNode;
};

type Position = { top: number; left: number };

const VIEWPORT_MARGIN = 8;

export const Tooltip = ({ label, shortcut, delayMs = 400, children }: TooltipProps) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<Position | null>(null);
  const timer = useRef<number | null>(null);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const floatRef = useRef<HTMLSpanElement | null>(null);
  const id = useId();

  useEffect(() => {
    return () => {
      if (timer.current != null) window.clearTimeout(timer.current);
    };
  }, []);

  const clampToViewport = (anchor: DOMRect, tip: DOMRect): Position => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const tw = tip.width;
    const th = tip.height;
    let left = anchor.left + anchor.width / 2 - tw / 2;
    left = Math.max(VIEWPORT_MARGIN, Math.min(left, vw - tw - VIEWPORT_MARGIN));
    let top = anchor.bottom + 6;
    if (top + th + VIEWPORT_MARGIN > vh) {
      const above = anchor.top - th - 6;
      top = above >= VIEWPORT_MARGIN ? above : Math.max(VIEWPORT_MARGIN, vh - th - VIEWPORT_MARGIN);
    }
    return { top, left };
  };

  useLayoutEffect(() => {
    if (!open) return;
    const anchor = wrapperRef.current?.getBoundingClientRect();
    const tip = floatRef.current?.getBoundingClientRect();
    if (!anchor || !tip) return;
    const next = clampToViewport(anchor, tip);
    if (!pos || pos.top !== next.top || pos.left !== next.left) {
      setPos(next);
    }
  }, [open, pos, label, shortcut]);

  const onEnter = () => {
    if (timer.current != null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const r = wrapperRef.current?.getBoundingClientRect();
      if (r) setPos({ top: r.bottom + 6, left: r.left + r.width / 2 });
      setOpen(true);
    }, delayMs);
  };
  const onLeave = () => {
    if (timer.current != null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    setOpen(false);
  };

  return (
    <span
      ref={wrapperRef}
      className={styles.tooltipWrapper}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
      aria-describedby={open ? id : undefined}
    >
      {children}
      {open && pos ? (
        <span
          ref={floatRef}
          role="tooltip"
          id={id}
          className={styles.tooltipFloat}
          style={{ top: pos.top, left: pos.left }}
        >
          {label}
          {shortcut ? <span className={styles.tooltipShortcut}> {shortcut}</span> : null}
        </span>
      ) : null}
    </span>
  );
};
