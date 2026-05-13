import { useEffect } from 'react';
import { undo, redo } from '@/domain/commands';
import { useSelectionStore, useEditorStore, useDimensionEditStore } from '@/state';
import { deleteSelected, duplicateSelected, selectAll } from '@/features/drawingTools/select/useSelectInteractions';
import { cancelAllDrawings } from '@/features/drawingTools/drawingCancelRegistry';
import { isToolEnabled } from './toolAvailability';
import { useSaveProject } from './useSaveProject';

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
  k: 'cut',
  m: 'meter',
};

export const useKeyboardShortcuts = (): void => {
  const { saveProject } = useSaveProject();
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
      if (mod && key === 'a' && !e.shiftKey) {
        e.preventDefault();
        selectAll();
        return;
      }
      if (mod && key === 's' && !e.shiftKey) {
        e.preventDefault();
        void saveProject();
        return;
      }
      if (e.key === 'Escape') {
        useDimensionEditStore.getState().cancelEdit();
        useSelectionStore.getState().clear();
        useEditorStore.getState().clearPendingDraw();
        cancelAllDrawings();
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
          const hasSurfaceSelected = useSelectionStore
            .getState()
            .selected.some((s) => s.kind === 'surface');
          if (isToolEnabled(t, { hasSurfaceSelected })) {
            useEditorStore.getState().setActiveTool(t);
          }
        } else if (key === 'g') {
          const es = useEditorStore.getState();
          es.setGridVisible(!es.gridVisible);
        } else if (key === 's') {
          const es = useEditorStore.getState();
          es.setSnap(!es.snapEnabled);
        } else if (e.key === '?' || e.key === 'F1') {
          window.dispatchEvent(new CustomEvent('mlp:toggleShortcutsHelp'));
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [saveProject]);
};
