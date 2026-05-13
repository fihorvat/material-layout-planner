import { useEffect } from 'react';
import { registerDrawingCancel } from './drawingCancelRegistry';

export type DrawingModifiers = { shift: boolean; alt: boolean; ctrl: boolean };

/**
 * Boilerplate shared by every drawing-tool wrapper:
 *
 * - Register the tool's `cancel` callback with the global Escape handler so
 *   the keyboard shortcut layer can dismiss any active drawing.
 * - Listen for `Escape` at the window level and route it to `cancel`. While
 *   typing in an `<input>` / `<textarea>` (e.g. the numeric prompt) keystrokes
 *   are ignored so the field can handle them itself.
 * - Forward any other key to the optional `onKeyDown` callback so each tool
 *   can implement its own Enter/Backspace/digit shortcuts on top of the
 *   shared filter.
 * - Provide pre-built `onStagePointerDown` / `onStagePointerMove` adapters
 *   that ignore non-primary buttons and unpack modifier keys into a stable
 *   `DrawingModifiers` object.
 */
export const useDrawingToolShell = (params: {
  cancel: () => void;
  onPointerDown?: (mods: DrawingModifiers) => void;
  onPointerMove?: (mods: DrawingModifiers) => void;
  onKeyDown?: (e: KeyboardEvent) => void;
}) => {
  const { cancel, onPointerDown, onPointerMove, onKeyDown } = params;

  useEffect(() => registerDrawingCancel(cancel), [cancel]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }
      if (e.key === 'Escape') {
        cancel();
        return;
      }
      onKeyDown?.(e);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [cancel, onKeyDown]);

  const onStagePointerDown = (e: { evt: MouseEvent }) => {
    if (e.evt.button !== 0) return;
    onPointerDown?.({ shift: e.evt.shiftKey, alt: e.evt.altKey, ctrl: e.evt.ctrlKey });
  };

  const onStagePointerMove = (e: { evt: MouseEvent }) => {
    onPointerMove?.({ shift: e.evt.shiftKey, alt: e.evt.altKey, ctrl: e.evt.ctrlKey });
  };

  return { onStagePointerDown, onStagePointerMove };
};
