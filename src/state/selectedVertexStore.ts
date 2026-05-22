import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';

export type SelectedVertex =
  | { kind: 'rectCorner'; entityId: string; corner: 0 | 1 | 2 | 3 }
  | { kind: 'polygonVertex'; entityId: string; index: number }
  | { kind: 'surfaceVertex'; surfaceId: string; index: number }
  | { kind: 'openingVertex'; surfaceId: string; openingId: string; index: number };

export const sameSelectedVertex = (a: SelectedVertex, b: SelectedVertex): boolean => {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'rectCorner' && b.kind === 'rectCorner') {
    return a.entityId === b.entityId && a.corner === b.corner;
  }
  if (a.kind === 'polygonVertex' && b.kind === 'polygonVertex') {
    return a.entityId === b.entityId && a.index === b.index;
  }
  if (a.kind === 'surfaceVertex' && b.kind === 'surfaceVertex') {
    return a.surfaceId === b.surfaceId && a.index === b.index;
  }
  return (
    a.surfaceId === b.surfaceId &&
    a.openingId === b.openingId &&
    a.index === b.index
  );
};

export type SelectedVertexState = {
  selectedVertex: SelectedVertex | null;
  selectVertex: (vertex: SelectedVertex) => void;
  clear: () => void;
  resetForTests: () => void;
};

export const useSelectedVertexStore = create<SelectedVertexState>()(
  subscribeWithSelector(
    immer((set) => ({
      selectedVertex: null,

      selectVertex: (vertex) =>
        set((state) => {
          state.selectedVertex = vertex;
        }),

      clear: () =>
        set((state) => {
          state.selectedVertex = null;
        }),

      resetForTests: () =>
        set((state) => {
          state.selectedVertex = null;
        }),
    })),
  ),
);

export const getSelectedVertex = (): SelectedVertex | null =>
  useSelectedVertexStore.getState().selectedVertex;