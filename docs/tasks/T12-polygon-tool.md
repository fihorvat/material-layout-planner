# T12 — Polygon tool

- **Milestone**: M2
- **Depends on**: T07, T08, T09
- **Status**: todo

## Goal

Implement the Polygon tool with click-to-add vertices, per-segment length display, numeric segment entry, snap support, and self-intersection warnings.

## Behavior (plan §9.4)

- Click to add a point.
- Snap to existing points (endpoints + polygon vertices).
- Live segment shown from last placed point to cursor with length + angle chip.
- Typing digits opens numeric overlay with `Length` and `Angle` (same component as T10).
- Enter (or double-click on first point) closes the polygon.
- Backspace removes the last placed point.
- Esc cancels and discards.
- On close, run `validatePolygon`; if invalid, show a confirm dialog:
  - Self-intersecting → block commit, show inline warning.
  - Degenerate / zero area → block commit.
  - `tooFewPoints` (n < 3) → block commit.

## Files

```
src/features/drawingTools/PolygonTool.tsx
src/features/drawingTools/polygon/usePolygonDraw.ts
src/features/drawingTools/polygon/PolygonPreview.tsx
src/features/drawingTools/polygon/SegmentLabel.tsx
src/features/drawingTools/polygon/__tests__/usePolygonDraw.test.tsx
```

## State machine

```ts
type PolygonDrawState =
  | { phase: 'idle' }
  | { phase: 'drawing'; points: Point2D[]; cursor: Point2D };
```

Phase becomes `'drawing'` on the first click; remains so until close, cancel, or full commit.

## Commit

- Build `PolygonEntity` (T02) with `points`, `name: undefined`, `showSegmentDimensions: false`, `showArea: false`, default style.
- Dispatch `addDrawingEntityCommand`.

## Visualization

- Committed segments: solid line, accent stroke 1.5 device px.
- Pending segment (from last point to cursor): dashed.
- Vertex dots at each placed point.
- Segment length labels render via `SegmentLabel` next to the segment midpoint, perpendicular offset 10 device px.

## Implementation steps

1. Build `usePolygonDraw`.
2. Build `PolygonPreview` and `SegmentLabel`.
3. Wire validation pre-commit using `validatePolygon` from T07.
4. Tests:
   - Sequence of clicks + Enter commits a polygon with the expected points.
   - Self-intersecting input blocked.
   - Backspace removes last point and updates preview.
   - Numeric submission appends a segment from the last point with given length/angle.
   - Snapping to first point within tolerance treats next click as close action.

## Decisions

- **Auto-close on click-near-first-vertex** within snap tolerance.
- **No holes here**: holes are added via the Opening tool (T16) on a surface.
- **Polygon orientation is normalized to CCW** at commit (use `ensureCCW`); this matches the convention used by the layout engine.

## Open questions

_(none)_

## Acceptance criteria

- [ ] Adding 3+ vertices and pressing Enter creates a polygon.
- [ ] Self-intersecting attempt blocked with a clear message.
- [ ] Backspace removes the last vertex.
- [ ] Numeric per-segment entry works.
- [ ] Segment labels visible during draw.
- [ ] Commit is undoable.
- [ ] Tests pass.

## Verification

```
npm test -- src/features/drawingTools/polygon
```

## Progress Log

_(append entries here)_
