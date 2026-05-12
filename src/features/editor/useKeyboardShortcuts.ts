import { useEffect } from 'react';
import { undo, redo } from '@/domain/commands';
import { useSelectionStore, useEditorStore } from '@/state';
import { deleteSelected, duplicateSelected } from '@/features/drawingTools/select/useSelectInteractions';

const TOOL_KEYS: Record<string, ReturnType<typeof useEditorStore.getState>['activeTool']> = {
  v: 'select',
  l: 'line',
  r: 'rectangle',
  p: 'polygon',
  o: 'opening',
  f: 'surface',
  d: 'dimension',
  t: 'label',
  c: 'connection',
  x: 'splitSurface',
};

export const useKeyboardShortcuts = (): void => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return;
      }
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      if (mod && key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      if (mod && ((key === 'z' && e.shiftKey) || key === 'y')) {
        e.preventDefault();
        redo();
        return;
      }
      if (mod && key === 'd') {
        e.preventDefault();
        duplicateSelected(10);
        return;
      }
      if (e.key === 'Escape') {
        useSelectionStore.getState().clear();
        useEditorStore.getState().clearPendingDraw();
        return;
      }
      if (!mod && (e.key === 'Delete' || e.key === 'Backspace')) {
        if (useSelectionStore.getState().selected.length > 0) {
          e.preventDefault();
          deleteSelected();
        }
        return;
      }
      if (!mod && !e.shiftKey && !e.altKey) {
        const t = TOOL_KEYS[key];
        if (t) {
          useEditorStore.getState().setActiveTool(t);
        } else if (key === 'g') {
          const es = useEditorStore.getState();
          es.setGridVisible(!es.gridVisible);
        } else if (key === 's') {
          const es = useEditorStore.getState();
          es.setSnap(!es.snapEnabled);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
};
