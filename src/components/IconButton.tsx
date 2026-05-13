import { useId, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import styles from './controls.module.css';

export type IconButtonProps = {
  label: string;
  shortcut?: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  children: ReactNode;
  ariaPressed?: boolean;
  buttonRef?: React.Ref<HTMLButtonElement>;
};

const TOOLTIP_MARGIN = 6;
const VIEWPORT_PAD = 4;

export const IconButton = ({
  label,
  shortcut,
  active,
  disabled,
  onClick,
  children,
  ariaPressed,
  buttonRef,
}: IconButtonProps) => {
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const tipId = useId();
  const showTip = (hover || focus) && !disabled;
  const innerBtnRef = useRef<HTMLButtonElement | null>(null);
  const tipRef = useRef<HTMLSpanElement | null>(null);
  const [tipPos, setTipPos] = useState<{ top: number; left: number } | null>(null);

  const setBtnRef = (el: HTMLButtonElement | null) => {
    innerBtnRef.current = el;
    if (typeof buttonRef === 'function') buttonRef(el);
    else if (buttonRef && typeof buttonRef === 'object') {
      (buttonRef as React.MutableRefObject<HTMLButtonElement | null>).current = el;
    }
  };

  useLayoutEffect(() => {
    if (!showTip) {
      setTipPos(null);
      return;
    }
    const place = () => {
      const btn = innerBtnRef.current;
      const tip = tipRef.current;
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      const tipW = tip?.offsetWidth ?? 0;
      const tipH = tip?.offsetHeight ?? 0;
      let top = r.bottom + TOOLTIP_MARGIN;
      if (top + tipH > window.innerHeight - VIEWPORT_PAD) {
        top = Math.max(VIEWPORT_PAD, r.top - tipH - TOOLTIP_MARGIN);
      }
      let left = r.left + r.width / 2 - tipW / 2;
      const maxLeft = window.innerWidth - VIEWPORT_PAD - tipW;
      if (left < VIEWPORT_PAD) left = VIEWPORT_PAD;
      else if (left > maxLeft) left = Math.max(VIEWPORT_PAD, maxLeft);
      setTipPos({ top, left });
    };
    place();
    const raf = window.requestAnimationFrame(place);
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [showTip, label, shortcut]);

  return (
    <>
      <button
        ref={setBtnRef}
        type="button"
        className={[styles.iconButton, active ? styles.iconButtonActive : ''].join(' ')}
        aria-label={label}
        aria-pressed={ariaPressed ?? active}
        aria-describedby={showTip ? tipId : undefined}
        disabled={disabled}
        onClick={onClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
      >
        {children}
      </button>
      {showTip && typeof document !== 'undefined'
        ? createPortal(
            <span
              ref={tipRef}
              role="tooltip"
              id={tipId}
              className={styles.tooltipFloat}
              style={{
                top: tipPos?.top ?? -9999,
                left: tipPos?.left ?? -9999,
                visibility: tipPos ? 'visible' : 'hidden',
              }}
            >
              {label}
              {shortcut ? <span className={styles.tooltipShortcut}> {shortcut}</span> : null}
            </span>,
            document.body,
          )
        : null}
    </>
  );
};
