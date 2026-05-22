import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKeyboardShortcuts } from '../useKeyboardShortcuts';
import {
  useDimensionEditStore,
  useEditorStore,
  useHistoryStore,
  useLabelUiStore,
  useProjectStore,
  useSelectedVertexStore,
  useSelectionStore,
} from '@/state';
import { createEmptyProject, defaultTextStyle } from '@/types';

vi.mock('../useSaveProject', () => ({
  useSaveProject: () => ({
    saveProject: vi.fn().mockResolvedValue(undefined),
    saving: false,
  }),
}));

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    useProjectStore.getState().resetForTests();
    useEditorStore.getState().resetForTests();
    useHistoryStore.getState().resetForTests();
    useSelectionStore.getState().resetForTests();
    useSelectedVertexStore.getState().resetForTests();
    useDimensionEditStore.getState().cancelEdit();
    useLabelUiStore.getState().resetForTests();
  });

  it('starts editing the selected label when F2 is pressed', () => {
    const project = createEmptyProject('Keyboard shortcuts');
    project.labels.push({
      id: 'lbl_1',
      text: 'Wall note',
      anchorType: 'free',
      position: { x: 0, y: 0 },
      rotationDeg: 0,
      style: defaultTextStyle(),
    });
    useProjectStore.getState().replaceProject(project);
    useSelectionStore.getState().select({ kind: 'label', id: 'lbl_1' });

    renderHook(() => useKeyboardShortcuts());

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F2' }));
    });

    expect(useLabelUiStore.getState().editingLabelId).toBe('lbl_1');
  });

  it('clears label editing state on Escape', () => {
    useLabelUiStore.getState().startEdit('lbl_1');
    useLabelUiStore.getState().setDragPreview('lbl_1', { x: 12, y: 18 });

    renderHook(() => useKeyboardShortcuts());

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });

    expect(useLabelUiStore.getState().editingLabelId).toBeNull();
    expect(useLabelUiStore.getState().dragPreviewPositions).toEqual({});
  });
});