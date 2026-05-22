import { create } from 'zustand';
import type { Point2D } from '@/types';

export type LabelUiState = {
  editingLabelId: string | null;
  dragPreviewPositions: Record<string, Point2D>;
  startEdit: (labelId: string) => void;
  cancelEdit: () => void;
  setDragPreview: (labelId: string, position: Point2D) => void;
  clearDragPreview: (labelId: string) => void;
  clearDragPreviews: () => void;
  resetForTests: () => void;
};

const initialState = () => ({
  editingLabelId: null as string | null,
  dragPreviewPositions: {} as Record<string, Point2D>,
});

export const useLabelUiStore = create<LabelUiState>((set) => ({
  ...initialState(),

  startEdit: (labelId) => set({ editingLabelId: labelId }),
  cancelEdit: () => set({ editingLabelId: null }),
  setDragPreview: (labelId, position) =>
    set((state) => ({
      dragPreviewPositions: { ...state.dragPreviewPositions, [labelId]: position },
    })),
  clearDragPreview: (labelId) =>
    set((state) => {
      const next = { ...state.dragPreviewPositions };
      delete next[labelId];
      return { dragPreviewPositions: next };
    }),
  clearDragPreviews: () => set({ dragPreviewPositions: {} }),
  resetForTests: () => set(initialState()),
}));

export const getLabelUi = (): LabelUiState => useLabelUiStore.getState();