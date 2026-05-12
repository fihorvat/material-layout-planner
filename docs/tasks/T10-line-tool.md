# T10 — Line tool

- **Milestone**: M2
- **Depends on**: T07, T08, T09
- **Status**: todo

## Goal

Implement the Line tool so users can draw measured lines via click-drag, numeric length + angle entry, axis-constrained drags, or by connecting two existing points.

## Modes supported (plan §9.2)

1. Start point + end point (free drag).
2. Start point + length + angle (typed in floating input).
3. Start point + horizontal length (Shift held → x-axis).
4. Start point + vertical length (Shift+held → y-axis depending on direction; see Constraint rules below).
5. Connect two existing points (via snapping to point candidates).

## Files

```
src/features/drawingTools/LineTool.tsx
src/features/drawingTools/line/useLineDraw.ts
src/features/drawingTools/line/LinePreview.tsx
src/features/drawingTools/line/NumericPromptOverlay.tsx
src/features/drawingTools/line/__tests__/useLineDraw.test.tsx
```

Plus a render in `ConstructionLayer` for committed lines (move existing `ConstructionLayer` placeholder code here or add a small component `ConstructionEntities.tsx` in `features/drawingTools/`).

## Behavior

State machine:

- `idle` → `pickFirst` (always idle on tool activation, mouse moves show snap marker).
- `pickFirst` → click sets first point; transitions to `pickSecond`. Begin drawing a *preview* line from first point to current cursor.
- `pickSecond` → during move:
  - Show length and angle in a floating chip near the cursor (e.g., `1234 mm @ 12°`).
  - If Shift held: constrain angle to multiples of 15° (closest), drawn from first point.
  - If user types a digit: open `NumericPromptOverlay`. It is a small floating form with two inputs `length` and `angle` (length focused). Pressing Enter commits the line using typed values; cursor direction defines the sign of the angle (i.e., quadrant) only when angle field is empty.
  - The `NumericPromptOverlay` parses input through `parseLength` (T07). Angle uses `parseFloat` of degrees, default `0` (horizontal).
  - Click commits the line with whatever the preview shows.
- `Esc` cancels the in-progress line.

Snapping:

- Use the shared `snap` module from T06.
- Candidate points = endpoints of all visible drawing entities + surface boundary vertices.
- Snap markers (small circle/cross) render in `HelpersLayer`.

Commit:

- Create a `LineEntity` (T02) with `id = newLineId()`, `start`, `end`, `showDimension: false`, default `style` from `project.settings.defaultLineColor`.
- Dispatch `addDrawingEntityCommand({ entity })`.

## `useLineDraw` hook

```ts
type LineDrawState =
  | { phase: 'pickFirst' }
  | { phase: 'pickSecond'; first: Point2D; cursor: Point2D; preview: LineEntity | null };

export const useLineDraw = (): {
  state: LineDrawState;
  onPointerMove: (worldPoint: Point2D, modifiers: ModifierKeys) => void;
  onPointerDown: (worldPoint: Point2D, modifiers: ModifierKeys) => void;
  onKeyDown: (e: KeyboardEvent) => void;
  cancel: () => void;
};
```

Keep state local to the hook (`useState`); only commit triggers a store action via the command dispatcher.

## NumericPromptOverlay

DOM (not Konva) overlay positioned at screen coordinates of the cursor. Two inputs `Length` and `Angle`. Tab cycles fields. Enter commits; Esc cancels.

- `Length` input parses with `parseLength`.
- `Angle` input accepts a number, optional `°` suffix.

When the overlay is open, suppress Konva pointer commits.

## Implementation steps

1. Implement `useLineDraw`.
2. Implement `LinePreview` (Konva `<Line>` with dashed style).
3. Implement `NumericPromptOverlay` as a DOM portal sibling to the Stage.
4. Mount `LineTool` from `CanvasStage` when `activeTool === 'line'`.
5. Tests for `useLineDraw`:
   - First click sets `first`.
   - Move updates `cursor` and `preview`.
   - Shift snaps angle to 15° multiples.
   - Numeric submit dispatches `addDrawingEntityCommand` with the expected geometry.
   - Esc resets to `pickFirst`.

## Decisions

- **Shift = angle constraint (15°)**, not axis-only. This matches `plan.md` §45 ("Shift: Constrain angle").
- **Direction sign**: when the user types only `length` and `angle`, the angle is interpreted absolutely (0° = east, 90° = north — but remember y is down, so 90° in screen-space points up; use mathematical angle convention `(x: cos, y: -sin)`? **No**: we keep y-down throughout. Therefore 0° = +x, 90° = +y (down). Document this in the UI hint: "angle measured clockwise from horizontal".
- **Cancel discards preview**; nothing is added to the store.

## Open questions

_(none)_

## Acceptance criteria

- [ ] Two-click drawing creates a line with correct geometry.
- [ ] Length-only numeric input creates a horizontal line of that length.
- [ ] Length + angle numeric input creates the expected line.
- [ ] Shift constrains to 15° multiples.
- [ ] Snap to existing endpoints works.
- [ ] Esc cancels mid-draw.
- [ ] Line preview shows length and angle as a label.
- [ ] Adding a line is undoable.
- [ ] Tests pass.

## Verification

```
npm test -- src/features/drawingTools/line
npm run dev   # manual draw
```

## Progress Log

_(append entries here)_
