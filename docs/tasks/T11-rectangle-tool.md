# T11 — Rectangle tool

- **Milestone**: M2
- **Depends on**: T07, T08, T09
- **Status**: todo

## Goal

Implement the Rectangle tool with multiple input modes (plan §9.3), live preview, numeric correction, and snapping.

## Modes

1. Click + drag + release → rectangle from corner to corner.
2. Click + numeric (width, height) → rectangle with origin at clicked point.
3. Center mode (`Alt` modifier during drag) → rectangle expands from center.
4. Two opposite corners (click, then click) — Shift held to square (1:1 aspect).

## Files

```
src/features/drawingTools/RectangleTool.tsx
src/features/drawingTools/rectangle/useRectangleDraw.ts
src/features/drawingTools/rectangle/RectanglePreview.tsx
src/features/drawingTools/rectangle/NumericPromptOverlay.tsx     (or reuse from line if generalized)
src/features/drawingTools/rectangle/__tests__/useRectangleDraw.test.tsx
```

## Behavior

State machine:

- `idle` → `pickFirst` (cursor snap markers visible).
- `pickFirst` → click sets `origin`; transitions to `pickSecond`.
- `pickSecond` → preview updates with current cursor.
  - `Shift` constrains to square.
  - `Alt` flips to center mode (origin = center).
  - Typing digits opens numeric overlay with `Width` and `Height` inputs.
- Commit on click (drag-release also commits) or Enter in numeric overlay.
- `Esc` cancels.

## Numeric overlay

Same component family as T10. Fields: `Width`, `Height`. Both parse via `parseLength`. Defaults to current cursor delta values.

## Commit

- Build `RectangleEntity`:
  ```ts
  {
    id, type: 'rectangle',
    origin: <top-left in world coords>,
    widthMm, heightMm, rotationDeg: 0,
    showDimensions: false,
    style: defaultDrawingStyle()
  }
  ```
- If center mode, compute `origin = center - (w/2, h/2)`.
- `rotationDeg = 0` for MVP (rotation happens via Select tool gizmo, T09).
- Dispatch `addDrawingEntityCommand({ entity })`.

## Implementation steps

1. Build `useRectangleDraw`.
2. Build `RectanglePreview` (Konva `<Rect>` dashed outline).
3. Mount from `CanvasStage`.
4. Tests:
   - Click-drag-release commits a rectangle of expected width/height.
   - `Shift` produces a square.
   - `Alt` produces a center-anchored rectangle.
   - Numeric submit produces exact dimensions.

## Decisions

- **Snap applies to both corners**, not just the first.
- **Negative-direction drags** (cursor left/up of origin) yield rectangles with positive width/height; we normalize before committing.

## Open questions

_(none)_

## Acceptance criteria

- [ ] Drag creates correctly sized rectangle.
- [ ] Shift forces 1:1 aspect.
- [ ] Alt anchors at center.
- [ ] Numeric submission works.
- [ ] Snap visualization shows during draw.
- [ ] Add is undoable.
- [ ] Tests pass.

## Verification

```
npm test -- src/features/drawingTools/rectangle
```

## Progress Log

_(append entries here)_
