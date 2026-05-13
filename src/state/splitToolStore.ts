import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export type SplitMode = 'line' | 'rectangle' | 'polygon' | 'dimension';

/** Mode for an area-style split (rectangle/polygon): keep inner as new surface or remove it. */
export type SplitInnerMode = 'extractInner' | 'subtractInner';

export type SplitDimensionPending = {
  surfaceId: string;
  edgeIndex: number;
} | null;

export type SplitToolState = {
  mode: SplitMode;
  innerMode: SplitInnerMode;
  dimensionPending: SplitDimensionPending;

  setMode: (mode: SplitMode) => void;
  setInnerMode: (innerMode: SplitInnerMode) => void;
  setDimensionPending: (pending: SplitDimensionPending) => void;

  resetForTests: () => void;
};

const buildInitial = () => ({
  mode: 'line' as SplitMode,
  innerMode: 'extractInner' as SplitInnerMode,
  dimensionPending: null as SplitDimensionPending,
});

export const useSplitToolStore = create<SplitToolState>()(
  subscribeWithSelector((set) => ({
    ...buildInitial(),
    setMode: (mode) => set({ mode, dimensionPending: null }),
    setInnerMode: (innerMode) => set({ innerMode }),
    setDimensionPending: (dimensionPending) => set({ dimensionPending }),
    resetForTests: () => set(buildInitial()),
  })),
);

export const getSplitTool = (): SplitToolState => useSplitToolStore.getState();
