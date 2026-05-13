import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { DrawingStyle } from '@/types';
import { defaultDrawingStyle } from '@/types';

/**
 * Shared default style used when committing new line, rectangle and polygon
 * entities. The Properties panel exposes editors for `strokeColor` and
 * `strokeWidthPx` while the corresponding drawing tool is active so the user
 * can pick a color/thickness before drawing. Per-entity overrides remain
 * available after selection.
 */
export type DrawingToolState = {
  style: DrawingStyle;
  setStyle: (style: DrawingStyle) => void;
  setStrokeColor: (color: string) => void;
  setStrokeWidthPx: (widthPx: number) => void;
  resetForTests: () => void;
};

const buildInitial = () => ({
  style: defaultDrawingStyle(),
});

export const useDrawingToolStore = create<DrawingToolState>()(
  subscribeWithSelector((set) => ({
    ...buildInitial(),
    setStyle: (style) => set({ style }),
    setStrokeColor: (color) =>
      set((s) => ({ style: { ...s.style, strokeColor: color } })),
    setStrokeWidthPx: (widthPx) =>
      set((s) => ({ style: { ...s.style, strokeWidthPx: widthPx } })),
    resetForTests: () => set(buildInitial()),
  })),
);

export const getDrawingTool = (): DrawingToolState =>
  useDrawingToolStore.getState();
