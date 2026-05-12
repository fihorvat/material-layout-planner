import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import styles from './controls.module.css';

export type TooltipProps = {
  label: string;
  shortcut?: string;
  delayMs?: number;
  children: ReactNode;
};

export const Tooltip = ({ label, shortcut, delayMs = 400, children }: TooltipProps) => {
  const [open, setOpen] = useState(false);
  const timer = useRef<number | null>(null);
  const id = useId();

  useEffect(() => {
    return () => {
      if (timer.current != null) window.clearTimeout(timer.current);
    };
  }, []);

  const onEnter = () => {
    if (timer.current != null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(true), delayMs);
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
      className={styles.tooltipWrapper}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
      aria-describedby={open ? id : undefined}
    >
      {children}
      {open ? (
        <span role="tooltip" id={id} className={styles.tooltip}>
          {label}
          {shortcut ? <span className={styles.tooltipShortcut}> {shortcut}</span> : null}
        </span>
      ) : null}
    </span>
  );
};
