import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import styles from './controls.module.css';

export type IconButtonProps = {
  label: string;
  shortcut?: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
  ariaPressed?: boolean;
};

export const IconButton = ({
  label,
  shortcut,
  active,
  disabled,
  onClick,
  children,
  ariaPressed,
}: IconButtonProps) => {
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const tipId = useId();
  const showTip = (hover || focus) && !disabled;
  return (
    <span className={styles.tooltipWrapper}>
      <button
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
      {showTip ? (
        <span role="tooltip" id={tipId} className={styles.tooltip}>
          {label}
          {shortcut ? <span className={styles.tooltipShortcut}> {shortcut}</span> : null}
        </span>
      ) : null}
    </span>
  );
};
