# T06 — Canvas stage (Konva, grid, pan/zoom)

- **Milestone**: M1
- **Depends on**: T05
- **Status**: todo

## Goal

Replace the placeholder canvas with a real `react-konva` stage that supports pan, zoom, snapping, and grid rendering. Provide a clear coordinate-system contract used by every later drawing tool.

## Coordinate system contract

- **World units**: millimeters (mm). x-right, y-down (Konva default).
- **Screen units**: device-independent pixels.
- One root `Konva.Layer` named `world` carries scale + position; every drawing layer is its child group so all geometry uses world coordinates.
- Transforms exposed via a helper module:

```ts
// src/features/editor/canvas/coords.ts
type Viewport = { offsetXPx: number; offsetYPx: number; scale: number };
export const worldToScreen = (p: Point2D, v: Viewport): { x: number; y: number };
export const screenToWorld = (sx: number, sy: number, v: Viewport): Point2D;
export const screenDeltaToWorld = (dxPx: number, dyPx: number, v: Viewport): { dx: number; dy: number };
```

Unit-test these.

## Files

```
src/features/editor/CanvasStage.tsx           (replaces CanvasPlaceholder)
src/features/editor/canvas/coords.ts
src/features/editor/canvas/GridLayer.tsx
src/features/editor/canvas/LayersRoot.tsx
src/features/editor/canvas/useViewportInteractions.ts
src/features/editor/canvas/useResizeObserver.ts
src/features/editor/canvas/snap.ts
src/features/editor/canvas/__tests__/coords.test.ts
src/features/editor/canvas/__tests__/snap.test.ts
```

## `CanvasStage`

Responsibilities:

- Render a `<Stage width={containerW} height={containerH}>`.
- Inside, render one `<Layer>` named `world` with `x`, `y`, `scaleX`, `scaleY` from `editorStore.viewport`.
- Inside `world`, mount `<LayersRoot />` which contains, in order:
  1. `BackgroundImageLayer` (placeholder until T34)
  2. `ConstructionLayer` (placeholder)
  3. `SurfacesLayer` (placeholder)
  4. `OpeningsLayer` (placeholder)
  5. `MaterialLayoutLayer` (placeholder)
  6. `OverlapLayer` (placeholder)
  7. `DimensionsLayer` (placeholder)
  8. `LabelsLayer` (placeholder)
  9. `HelpersLayer` (selection rectangles, snap markers)
  10. `GridLayer` is rendered separately as the bottom screen-fixed layer (see Grid below)
- Use `ResizeObserver` (via `useResizeObserver`) to keep the stage sized to its container.

Each placeholder layer is a `<Group>` returning `null` for now. They will be filled by later tasks. Ordering is significant.

## Pan / zoom (`useViewportInteractions`)

- **Pan**: Space + drag, OR middle mouse drag. While active, set cursor to `grabbing`.
- **Zoom**: Wheel zooms toward the cursor. Implementation: in wheel handler, compute world point under cursor before, change scale by `factor = exp(-deltaY * 0.0015)`, clamp scale to `[0.05, 50]`, then adjust `offset` so the same world point stays under the cursor. (Math identical to `editorStore.zoomAt` from T03.)
- **Keyboard**: `+` / `-` zoom centered on viewport center; `0` resets to scale 1 and offset 0; `Home` fits content (placeholder: re-centers to origin until surfaces exist).
- Updates `editorStore.viewport` via store actions; do not duplicate state on the Konva node — read it back on every render.

## Grid (`GridLayer`)

- Renders only when `editorStore.gridVisible === true`.
- Two grids:
  - Minor: every `gridSizeMm` mm; stroke `#e5e7eb`, 1 device pixel.
  - Major: every `5 × gridSizeMm`; stroke `#cbd5e1`, 1 device pixel.
- Origin axis lines: x=0 and y=0, stroke `#9ca3af`, 1.5 device pixels.
- Only draw lines that fall within the visible viewport (compute the world bounds from screen size + viewport).
- Hide grid when zoom is too low (minor spacing < 4 px) — only draw major; if major < 4 px, draw nothing.
- 1 device pixel = `1 / scale` world units (Konva scales stroke widths by default unless `strokeScaleEnabled=false`; use `strokeScaleEnabled={false}` on lines).

## Snapping (`snap.ts`)

Pure functions, no React. Used by drawing tools later.

```ts
type SnapInput = {
  worldPoint: Point2D;
  tolerancePx: number;
  scale: number;
  gridSizeMm: number;
  snapEnabled: boolean;
  snapModes: SnapMode[];          // ['grid','point','endpoint','midpoint','axis','angle']
  candidatePoints?: Point2D[];    // collected from existing entities
  candidateSegments?: { a: Point2D; b: Point2D }[];
};
type SnapResult = {
  point: Point2D;
  source: SnapMode | 'none';
  marker?: { kind: SnapMode; point: Point2D };
};
export const snap = (input: SnapInput): SnapResult;
```

Snap order (first hit wins):

1. Endpoint of candidate segments
2. Midpoint of candidate segments
3. Intersection of axis lines through reference point (held only by tools, not relevant in MVP smoke)
4. Other entity points (`candidatePoints`)
5. Grid (round to `gridSizeMm`)

If `Alt` is held (passed in via `snapEnabled=false` from the caller), snap is bypassed.

Tolerance: convert `tolerancePx / scale` to world mm.

## Implementation steps

1. Build `coords.ts` + tests (zoomAt invariant: world point under cursor unchanged after zoom).
2. Build `useResizeObserver`.
3. Build `useViewportInteractions` hook attached to the Stage.
4. Build `GridLayer` with the visible-range optimization.
5. Build `LayersRoot` with all placeholder groups.
6. Mount `CanvasStage` in `EditorPage` replacing `CanvasPlaceholder`.
7. Build `snap.ts` and unit-test each mode.

## Decisions

- **`strokeScaleEnabled={false}` everywhere** in the world layer so 1 px stays 1 px regardless of zoom. Dimension text and labels follow the same convention.
- **Grid renders inside the world layer**, not as a fixed-screen layer. This way the grid pans/zooms naturally.
- **Snapping has its own pure module** so any tool can use it without coupling to React.
- **Background color**: solid `#fbfcfe` from theme.

## Open questions

_(none)_

## Acceptance criteria

- [ ] Stage sizes to its container and reflows on window resize.
- [ ] Mouse wheel zoom keeps the world point under cursor stationary (manual + unit test on math).
- [ ] Pan with middle mouse or Space+drag works.
- [ ] `+`/`-`/`0` keyboard shortcuts work.
- [ ] Grid renders, hides when zoomed out too far, and toggles via toolbar.
- [ ] Origin axes visible at `(0,0)`.
- [ ] `coords.ts` and `snap.ts` unit tests pass.
- [ ] No regressions in earlier acceptance criteria.

## Verification

```
npm test -- src/features/editor/canvas
npm run dev   # manual zoom, pan, grid toggle
```

## Progress Log

_(append entries here)_
