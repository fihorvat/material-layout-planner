# T09 — Select tool

- **Milestone**: M2
- **Depends on**: T06, T08
- **Status**: todo

## Goal

Build the Select tool — the user's primary cursor for picking, moving, resizing, deleting, and duplicating objects on the canvas. It also handles marquee selection.

## Scope (MVP)

Selectable kinds (registered now; some kinds become real only when later tasks add their entities):

- `point`, `line`, `rectangle`, `polygon`, `surface`, `opening`, `dimension`, `label`, `materialPiece`, `patternHandle`, `backgroundImage`.

Operations:

- Single-click selects (clears previous unless Shift held).
- Shift-click adds/removes from selection.
- Drag on empty canvas → marquee rectangle; on release, selects all entities intersecting the marquee.
- `Esc` clears selection.
- `Delete` / `Backspace` deletes selected (via `deleteDrawingEntityCommand` or kind-specific delete commands when they exist).
- `Ctrl/Cmd + D` duplicates selected with a 10 mm offset.
- Drag selected entity body → move (single command on `pointerup`).
- Drag a point/vertex handle of a line/polygon → move just that vertex.
- Resize handles for rectangles (8 handles: corners + edge midpoints).
- Rotate handle for rectangles above top edge.

Out of scope (handled by later tasks): editing material pieces directly (T28+ keeps pieces read-only).

## Files

```
src/features/drawingTools/SelectTool.tsx
src/features/drawingTools/select/HitTest.ts
src/features/drawingTools/select/MarqueeOverlay.tsx
src/features/drawingTools/select/SelectionOverlay.tsx
src/features/drawingTools/select/ResizeHandles.tsx
src/features/drawingTools/select/PointHandles.tsx
src/features/drawingTools/select/useSelectInteractions.ts
src/features/drawingTools/select/__tests__/HitTest.test.ts
src/features/drawingTools/select/__tests__/useSelectInteractions.test.tsx
```

The Select tool is mounted by `CanvasStage` whenever `editorStore.activeTool === 'select'`. It listens to stage pointer events.

## Hit testing — `HitTest.ts`

Pure function operating on world coords:

```ts
type HitCandidate = { kind: SelectableKind; id: string; zIndex: number; bbox: Aabb };
type HitTestInput = {
  worldPoint: Point2D;
  tolerancePxAsMm: number;   // converted by the caller using viewport.scale
  project: Project;
  layers: LayerVisibility;
};
type HitTestResult = { topHit: HitCandidate | null; allHits: HitCandidate[] };
export const hitTest = (input: HitTestInput): HitTestResult;
```

Order of preference (highest z-index first, then smallest bbox area for tie-breaking):

1. Material piece (if layer visible)
2. Opening
3. Surface boundary edges / fill
4. Drawing entity (rectangle / polygon / line)
5. Point handles
6. Background image (only when its layer is selected/active)

Skip locked layers.

## Selection overlay

`SelectionOverlay` renders an outline around each selected entity:

- Bounding box dashed rectangle, 1.5 device pixels, accent color.
- Resize handles for rectangles and material pieces (read-only highlight, no actual resize for pieces).
- Vertex handles for polygons and lines (round dots, 8 px device).
- Rotate handle for rectangles (line + circle).

## Marquee selection

- Begin on `pointerdown` over empty canvas.
- Render a translucent rectangle `MarqueeOverlay`.
- On `pointermove`, update the second corner.
- On `pointerup`, compute selection: include any entity whose AABB intersects the marquee (per plan: intersection, not containment, since users expect partial selection).
- Shift held during marquee → additive selection.
- Alt held → containment-only selection (entity must be fully inside marquee).

## Move / resize / rotate

Move:

- `pointerdown` on an already-selected entity begins a drag.
- During drag, apply a *visual-only* transform (use the Konva node's `position` / `offset`; do not touch the store).
- On `pointerup`, emit one of:
  - `updateDrawingEntityCommand` (for `DrawingEntity`)
  - `updateSurfaceCommand` (T15)
  - `updateLabelCommand` (T14)
- If the cursor didn't move beyond 2 device px, treat as a click, not a drag.

Resize (rectangle):

- 8 handles; dragging a handle changes width/height (and origin if dragging a left/top handle).
- Hold Shift to maintain aspect ratio.

Rotate (rectangle):

- Top rotate handle. Hold Shift to snap to 15° increments.

Point edit (line / polygon):

- Dragging a vertex updates the corresponding point in the entity.

All transforms must respect snapping (use T06's `snap` module).

## `useSelectInteractions`

Encapsulates all the pointer handlers. Returns:

```ts
{ onStagePointerDown, onStagePointerMove, onStagePointerUp,
  overlays: ReactNode }
```

The CanvasStage attaches the handlers when `activeTool === 'select'`.

## Implementation steps

1. Build `HitTest.ts` with unit tests for lines (point-to-segment distance), rectangles (AABB + interior fill), polygons (point-in-polygon), and z-ordering tie-breaks.
2. Build `SelectionOverlay` and `MarqueeOverlay`.
3. Build `useSelectInteractions` orchestrating clicks, drags, marquee, and Shift/Alt modifiers.
4. Wire keyboard handlers (`Delete`, `Esc`, `Ctrl+D`) in `useKeyboardShortcuts`.
5. Tests:
   - `hitTest` returns the topmost entity by z-index.
   - Locked layers ignored.
   - Marquee intersects vs contains modes.
   - Shift-click toggles entries.
   - Duplicate moves a copy by 10 mm in both axes.

## Decisions

- **No multi-entity rotate/resize gizmo in MVP**. Multi-select supports move and delete only.
- **Visual-only drag during pointermove**, command on pointerup. This avoids spamming undo stack and keeps store state consistent.
- **Vertex handles render only when zoom > 0.4** to avoid visual noise.
- **Hit tolerance**: 8 device pixels (matches default snap tolerance).

## Open questions

_(none)_

## Acceptance criteria

- [ ] Click selects an entity; click on empty space clears selection.
- [ ] Shift-click toggles entries.
- [ ] Marquee drag selects entities that intersect; Alt-marquee requires containment.
- [ ] `Delete` removes selected drawing entities via commands (undoable).
- [ ] Move drag emits a single `updateDrawingEntity` command.
- [ ] Resize handles work on rectangles; Shift constrains aspect ratio.
- [ ] Vertex drag for polygons emits a single update command.
- [ ] `Ctrl+D` duplicates selection by `(10, 10)` mm.
- [ ] Locked layer entities are not selectable.
- [ ] Tests pass.

## Verification

```
npm test -- src/features/drawingTools/select
npm run dev   # manual: create a rectangle via store seeding fixture, select/move/resize/delete
```

## Progress Log

_(append entries here)_
