import { create } from 'zustand';

export type DimensionEditTarget =
  | { kind: 'line'; entityId: string }
  | { kind: 'rectWidth'; entityId: string }
  | { kind: 'rectHeight'; entityId: string }
  | { kind: 'polygonEdge'; entityId: string; edgeIndex: number }
  | { kind: 'surfaceEdge'; surfaceId: string; edgeIndex: number };

export type DimensionEditState = {
  editing: DimensionEditTarget | null;
  startEdit: (target: DimensionEditTarget) => void;
  cancelEdit: () => void;
};

export const useDimensionEditStore = create<DimensionEditState>((set) => ({
  editing: null,
  startEdit: (target) => set({ editing: target }),
  cancelEdit: () => set({ editing: null }),
}));

export const getDimensionEdit = (): DimensionEditState =>
  useDimensionEditStore.getState();
