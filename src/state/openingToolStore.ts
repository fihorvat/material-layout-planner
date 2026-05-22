import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { DrawingStyle } from '@/types';
import { defaultDrawingStyle } from '@/types';

export type OpeningToolMode = 'rectangle' | 'polygon';

export type OpeningToolState = {
  mode: OpeningToolMode;
  style: DrawingStyle;
  showDimensions: boolean;
  setMode: (mode: OpeningToolMode) => void;
  setStyle: (style: DrawingStyle) => void;
  setShowDimensions: (value: boolean) => void;
  resetForTests: () => void;
};

const buildInitial = () => ({
  mode: 'rectangle' as OpeningToolMode,
  style: defaultDrawingStyle(),
  showDimensions: true,
});

export const useOpeningToolStore = create<OpeningToolState>()(
  subscribeWithSelector((set) => ({
    ...buildInitial(),
    setMode: (mode) => set({ mode }),
    setStyle: (style) => set({ style }),
    setShowDimensions: (value) => set({ showDimensions: value }),
    resetForTests: () => set(buildInitial()),
  })),
);

export const getOpeningTool = (): OpeningToolState => useOpeningToolStore.getState();
