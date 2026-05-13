import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore, ZOOM_MIN, ZOOM_MAX, DEFAULT_ZOOM } from '../editorStore';

describe('editorStore', () => {
  beforeEach(() => {
    useEditorStore.getState().resetForTests();
  });

  it('defaults to select tool, visible grid, snap on', () => {
    const s = useEditorStore.getState();
    expect(s.activeTool).toBe('select');
    expect(s.gridVisible).toBe(true);
    expect(s.snapEnabled).toBe(true);
    expect(s.snapTolerancePx).toBe(8);
    expect(s.viewport).toEqual({ offsetXPx: 0, offsetYPx: 0, scale: DEFAULT_ZOOM });
  });

  it('setActiveTool changes tool and clears pendingDraw', () => {
    useEditorStore.getState().setPendingDraw({ kind: 'line', start: { x: 1, y: 2 } });
    useEditorStore.getState().setActiveTool('rectangle');
    expect(useEditorStore.getState().activeTool).toBe('rectangle');
    expect(useEditorStore.getState().pendingDraw).toBeNull();
  });

  it('panBy increments viewport offsets', () => {
    useEditorStore.getState().panBy(10, -20);
    const v = useEditorStore.getState().viewport;
    expect(v.offsetXPx).toBe(10);
    expect(v.offsetYPx).toBe(-20);
  });

  it('zoomAt keeps the world point under the screen point stationary', () => {
    const screen = { x: 100, y: 100 };
    const v0 = useEditorStore.getState().viewport;
    const worldBefore = {
      x: (screen.x - v0.offsetXPx) / v0.scale,
      y: (screen.y - v0.offsetYPx) / v0.scale,
    };
    useEditorStore.getState().zoomAt(screen, 2);
    const v1 = useEditorStore.getState().viewport;
    const worldAfter = {
      x: (screen.x - v1.offsetXPx) / v1.scale,
      y: (screen.y - v1.offsetYPx) / v1.scale,
    };
    expect(v1.scale).toBeCloseTo(v0.scale * 2, 10);
    expect(worldAfter.x).toBeCloseTo(worldBefore.x, 6);
    expect(worldAfter.y).toBeCloseTo(worldBefore.y, 6);
  });

  it('zoomAt clamps scale within bounds', () => {
    useEditorStore.getState().zoomAt({ x: 0, y: 0 }, 1000);
    expect(useEditorStore.getState().viewport.scale).toBe(ZOOM_MAX);

    useEditorStore.getState().resetForTests();
    useEditorStore.getState().zoomAt({ x: 0, y: 0 }, 1e-6);
    expect(useEditorStore.getState().viewport.scale).toBe(ZOOM_MIN);
  });

  it('toggleLayerVisible flips the visible flag', () => {
    useEditorStore.getState().toggleLayerVisible('surfaces');
    expect(useEditorStore.getState().layers.surfaces.visible).toBe(false);
    useEditorStore.getState().toggleLayerVisible('surfaces');
    expect(useEditorStore.getState().layers.surfaces.visible).toBe(true);
  });

  it('setLayerOpacity clamps to [0,1]', () => {
    useEditorStore.getState().setLayerOpacity('overlap', 2);
    expect(useEditorStore.getState().layers.overlap.opacity01).toBe(1);
    useEditorStore.getState().setLayerOpacity('overlap', -5);
    expect(useEditorStore.getState().layers.overlap.opacity01).toBe(0);
  });

  it('setGridVisible and setSnap update flags', () => {
    useEditorStore.getState().setGridVisible(false);
    useEditorStore.getState().setSnap(false);
    const s = useEditorStore.getState();
    expect(s.gridVisible).toBe(false);
    expect(s.snapEnabled).toBe(false);
  });

  it('drawingModeEnabled defaults to false and toggle/set flip the flag', () => {
    expect(useEditorStore.getState().drawingModeEnabled).toBe(false);
    useEditorStore.getState().toggleDrawingMode();
    expect(useEditorStore.getState().drawingModeEnabled).toBe(true);
    useEditorStore.getState().toggleDrawingMode();
    expect(useEditorStore.getState().drawingModeEnabled).toBe(false);
    useEditorStore.getState().setDrawingModeEnabled(true);
    expect(useEditorStore.getState().drawingModeEnabled).toBe(true);
  });
});
