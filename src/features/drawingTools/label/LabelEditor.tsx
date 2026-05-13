import { useEffect, useRef, useState } from 'react';
import styles from './LabelEditor.module.css';

type LabelEditorProps = {
  initialText?: string;
  onSubmit: (text: string) => void;
  onCancel: () => void;
};

export const LabelEditor = ({ initialText = '', onSubmit, onCancel }: LabelEditorProps) => {
  const [text, setText] = useState(initialText);
  const ref = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onCancel();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onCancel]);

  return (
    <div
      className={styles.popover}
      role="dialog"
      aria-label="Edit label text"
    >
      <div className={styles.header}>
        <span className={styles.title}>Label text</span>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onCancel}
          aria-label="Close label editor"
          title="Close (Esc)"
        >
          ×
        </button>
      </div>
      <input
        ref={ref}
        className={styles.input}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onSubmit(text);
          } else if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            onCancel();
          }
        }}
        placeholder="Enter label…"
      />
      <div className={styles.actions}>
        <button type="button" className={styles.btn} onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={() => onSubmit(text)}
        >
          Add
        </button>
      </div>
      <div className={styles.hint}>Enter to confirm · Esc to cancel</div>
    </div>
  );
};
