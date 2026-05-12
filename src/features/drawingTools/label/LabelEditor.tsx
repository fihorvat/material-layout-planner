import { useEffect, useRef, useState } from 'react';

export type LabelEditorProps = {
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
  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        left: 12,
        zIndex: 50,
        background: 'white',
        border: '1px solid #cbd5e1',
        padding: 8,
        borderRadius: 6,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      }}
      role="dialog"
      aria-label="Edit label text"
    >
      <input
        ref={ref}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onSubmit(text);
          } else if (e.key === 'Escape') {
            e.preventDefault();
            onCancel();
          }
        }}
        style={{ width: 180 }}
      />
    </div>
  );
};
