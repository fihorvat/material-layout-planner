import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Point2D } from '@/types';

export type ToolId =
  | 'select'
  | 'line'
  | 'rectangle'
  | 'polygon'
  | 'opening'
  | 'dimension'
  | 'label'
  | 'surface'
  | 'connection'
  | 'patternOrigin'
  | 'splitSurface'
  | 'cut'
  | 'meter'
  | 'calibrateImage';

export type LayerId =
  | 'backgroundImage'
  | 'construction'
  | 'surfaces'
  | 'openings'
  | 'dimensions'
  | 'materialLayout'
  | 'overlap'
  | 'labels'
  | 'helpers'
  | 'warnings';

export const LAYER_IDS: readonly LayerId[] = [
  'backgroundImage',
  'construction',
  'surfaces',
  'openings',
  'dimensions',
  'materialLayout',
  'overlap',
  'labels',
  'helpers',
  'warnings',
];

export type Viewport = { offsetXPx: number; offsetYPx: number; scale: number };

export type LayerSettings = { visible: boolean; locked: boolean; opacity01: number };
export type LayerVisibility = Record<LayerId, LayerSettings>;

export type PendingDrawState =
  | { kind: 'line'; start: Point2D }
  | { kind: 'rectangle'; start: Point2D }
  | { kind: 'polygon'; points: Point2D[] }
  | { kind: 'opening'; points: Point2D[] };

export const ZOOM_MIN = 0.05;
export const ZOOM_MAX = 50;

/**
 * Default viewport scale used on first load and on viewport reset.
 * World coordinates are in millimetres, so `scale = 1` means 1 mm = 1 px —
 * a 2.79 m line would then be 2790 px tall, which doesn't fit on screen.
 * At 0.2, 1 m = 200 px so a typical 5 m x 4 m room fits comfortably.
 */
export const DEFAULT_ZOOM = 0.2;

export const clampZoom = (scale: number): number =>
  Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, scale));

export type EditorState = {
  activeTool: ToolId;
  viewport: Viewport;
  snapEnabled: boolean;
  snapTolerancePx: number;
  gridVisible: boolean;
  drawingModeEnabled: boolean;
  layers: LayerVisibility;
  pendingDraw: PendingDrawState | null;
  hoverEntityId: string | null;

  setActiveTool: (tool: ToolId) => void;
  setViewport: (next: Viewport) => void;
  panBy: (dxPx: number, dyPx: number) => void;
  zoomAt: (screenPoint: { x: number; y: number }, factor: number) => void;
  resetViewport: () => void;
  toggleLayerVisible: (id: LayerId) => void;
  toggleLayerLocked: (id: LayerId) => void;
  setLayerOpacity: (id: LayerId, opacity01: number) => void;
  setGridVisible: (visible: boolean) => void;
  setSnap: (enabled: boolean) => void;
  setDrawingModeEnabled: (enabled: boolean) => void;
  toggleDrawingMode: () => void;
  setHover: (id: string | null) => void;
  setPendingDraw: (state: PendingDrawState | null) => void;
  clearPendingDraw: () => void;
  resetForTests: () => void;
};

const buildLayers = (): LayerVisibility => {
  const layers = {} as LayerVisibility;
  for (const id of LAYER_IDS) {
    layers[id] = { visible: true, locked: false, opacity01: 1 };
  }
  return layers;
};

const initialViewport = (): Viewport => ({ offsetXPx: 0, offsetYPx: 0, scale: DEFAULT_ZOOM });

const buildInitialState = () => ({
  activeTool: 'select' as ToolId,
  viewport: initialViewport(),
  snapEnabled: true,
  snapTolerancePx: 8,
  gridVisible: true,
  drawingModeEnabled: false,
  layers: buildLayers(),
  pendingDraw: null as PendingDrawState | null,
  hoverEntityId: null as string | null,
});

export const useEditorStore = create<EditorState>()(
  subscribeWithSelector(
    immer((set) => ({
      ...buildInitialState(),

      setActiveTool: (tool) =>
        set((s) => {
          s.activeTool = tool;
          s.pendingDraw = null;
        }),

      setViewport: (next) =>
        set((s) => {
          s.viewport = { ...next, scale: clampZoom(next.scale) };
        }),

      panBy: (dxPx, dyPx) =>
        set((s) => {
          s.viewport.offsetXPx += dxPx;
          s.viewport.offsetYPx += dyPx;
        }),

      zoomAt: (screenPoint, factor) =>
        set((s) => {
          const oldScale = s.viewport.scale;
          const newScale = clampZoom(oldScale * factor);
          const effective = newScale / oldScale;
          s.viewport.offsetXPx =
            screenPoint.x - (screenPoint.x - s.viewport.offsetXPx) * effective;
          s.viewport.offsetYPx =
            screenPoint.y - (screenPoint.y - s.viewport.offsetYPx) * effective;
          s.viewport.scale = newScale;
        }),

      resetViewport: () =>
        set((s) => {
          s.viewport = initialViewport();
        }),

      toggleLayerVisible: (id) =>
        set((s) => {
          s.layers[id].visible = !s.layers[id].visible;
        }),

      toggleLayerLocked: (id) =>
        set((s) => {
          s.layers[id].locked = !s.layers[id].locked;
        }),

      setLayerOpacity: (id, opacity01) =>
        set((s) => {
          s.layers[id].opacity01 = Math.max(0, Math.min(1, opacity01));
        }),

      setGridVisible: (visible) =>
        set((s) => {
          s.gridVisible = visible;
        }),

      setSnap: (enabled) =>
        set((s) => {
          s.snapEnabled = enabled;
        }),

      setDrawingModeEnabled: (enabled) =>
        set((s) => {
          s.drawingModeEnabled = enabled;
        }),

      toggleDrawingMode: () =>
        set((s) => {
          s.drawingModeEnabled = !s.drawingModeEnabled;
        }),

      setHover: (id) =>
        set((s) => {
          s.hoverEntityId = id;
        }),

      setPendingDraw: (state) =>
        set((s) => {
          s.pendingDraw = state;
        }),

      clearPendingDraw: () =>
        set((s) => {
          s.pendingDraw = null;
        }),

      resetForTests: () =>
        set((s) => {
          const fresh = buildInitialState();
          Object.assign(s, fresh);
        }),
    })),
  ),
);

export const getEditor = (): EditorState => useEditorStore.getState();
