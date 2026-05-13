import { IconButton } from './IconButton';

export type ModalCloseButtonProps = {
  onClose: () => void;
  /** Accessible label override. Defaults to "Close". */
  label?: string;
};

/** Standard X-icon close button for modal/dialog headers. */
export const ModalCloseButton = ({ onClose, label = 'Close' }: ModalCloseButtonProps) => (
  <IconButton label={label} onClick={onClose}>
    <span aria-hidden>{'\u00D7'}</span>
  </IconButton>
);
