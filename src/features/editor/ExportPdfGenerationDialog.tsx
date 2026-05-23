import { ModalCloseButton } from '@/components';
import styles from './editor.module.css';

type ExportPdfGenerationDialogProps = {
  open: boolean;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export const ExportPdfGenerationDialog = ({
  open,
  busy,
  onCancel,
  onConfirm,
}: ExportPdfGenerationDialogProps) => {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Generate material layout before PDF export"
      className={styles.exportPromptBackdrop}
      onClick={() => {
        if (!busy) onCancel();
      }}
    >
      <div className={styles.exportPromptCard} onClick={(event) => event.stopPropagation()}>
        <div className={styles.exportPromptHeader}>
          <div>
            <div className={styles.exportPromptEyebrow}>PDF export</div>
            <h2 className={styles.exportPromptTitle}>Generate the material layout first?</h2>
          </div>
          <ModalCloseButton onClose={onCancel} />
        </div>

        <p className={styles.exportPromptBody}>
          This project currently has live preview layouts. Generate optimized material layouts
          now so the exported PDF includes finalized layout pages, cut lists, and cutting
          diagrams.
        </p>

        <div className={styles.exportPromptHighlights}>
          <div className={styles.exportPromptHighlight}>
            <strong>Current state</strong>
            <span>Preview layout only</span>
          </div>
          <div className={styles.exportPromptArrow} aria-hidden>
            -&gt;
          </div>
          <div className={styles.exportPromptHighlightAccent}>
            <strong>Export result</strong>
            <span>Generated layout included in the PDF</span>
          </div>
        </div>

        <div className={styles.exportPromptFooter}>
          <button type="button" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.exportPromptPrimaryButton}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'Generating layout\u2026' : 'Generate and export PDF'}
          </button>
        </div>
      </div>
    </div>
  );
};