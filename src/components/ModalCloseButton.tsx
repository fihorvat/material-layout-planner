import { IconButton } from './IconButton';
import styles from './controls.module.css';

export type ModalCloseButtonProps = {
  onClose: () => void;
  /** Accessible label override. Defaults to "Close". */
  label?: string;
};

/** Standard X-icon close button for modal/dialog headers. */
export const ModalCloseButton = ({ onClose, label = 'Close' }: ModalCloseButtonProps) => (
  <IconButton label={label} onClick={onClose}>
    <span aria-hidden className={styles.closeGlyph}>{'\u00D7'}</span>
  </IconButton>
);
