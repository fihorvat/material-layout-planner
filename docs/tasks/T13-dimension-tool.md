# T13 — Dimension tool & rendering

- **Milestone**: M2
- **Depends on**: T07, T10
- **Status**: todo

## Goal

Allow users to create dimension annotations that reference existing geometry and render correctly with extension lines, arrows, and text. Dimensions update automatically when their referenced geometry moves.

## Dimension types (plan §9.6)

- `horizontal` — distance between two points along x.
- `vertical` — distance between two points along y.
- `aligned` — distance between two points along the line that connects them (or along a referenced segment).
- `angle` — angle between two segments sharing a vertex.
- `area` — surface or polygon area label (no extension lines, just centered text).

## Files

```
src/features/drawingTools/DimensionTool.tsx
src/features/drawingTools/dimension/useDimensionDraw.ts
src/features/drawingTools/dimension/DimensionRenderer.tsx
src/features/drawingTools/dimension/computeDimension.ts
src/features/drawingTools/dimension/__tests__/computeDimension.test.ts
```

## Reference resolution — `computeDimension.ts`

Pure function:

```ts
type ComputedDimension =
  | { kind: 'linear'; a: Point2D; b: Point2D; valueText: string; midpoint: Point2D; angleDeg: number }
  | { kind: 'angle'; vertex: Point2D; armA: Point2D; armB: Point2D; valueText: string }
  | { kind: 'area'; center: Point2D; valueText: string };

export const computeDimension = (
  dim: DimensionEntity,
  project: Project
): ComputedDimension | null;
```

Reference types (from T02):

- `{ kind: 'point', id }` → resolved against drawing entities (points by endpoint) or surface vertices.
- `{ kind: 'line', id }` → a `LineEntity` whose `start`/`end` are used.
- `{ kind: 'edge', id, pointIndex }` → a surface edge identified by `(surfaceId, edgeIndex)`. (`id` is the surface ID; `pointIndex` is the start vertex index; edge is `points[i] → points[(i+1) % n]`.)
- `{ kind: 'entity', id }` → for `area` dimensions, references a polygon or surface; reads its area.

`textOverride` wins over computed text. Format uses `formatLength` (mm by default, or `auto` if `dim.unitDisplay === 'auto'` — add this optional field via a follow-up to T02 if needed).

## Tool flow

1. Activate Dimension tool; selector at top of properties panel chooses dimension type (Horizontal, Vertical, Aligned, Angle, Area).
2. For linear types:
   - Click first reference (point/endpoint/segment).
   - Click second reference.
   - Move cursor to position dimension line; click to set `offsetMm`.
3. For angle:
   - Click two segments sharing a vertex.
   - Move cursor to set arc radius; click to commit.
4. For area:
   - Click a polygon or surface.
   - Click to set label position.

## Rendering — `DimensionRenderer`

For each `DimensionEntity`:

- Compute `ComputedDimension`. If null (broken ref), render a red placeholder with text "?".
- Draw extension lines from `a` and `b` perpendicular to the dimension direction.
- Draw a dimension line parallel to the points, offset by `offsetMm`.
- Draw arrowheads at each end (filled triangles, 8 device px length).
- Render the text on top of the dimension line, with background fill matching canvas background.
- `area`: single text centered at `center`.

All strokes use `strokeScaleEnabled={false}`; text uses fixed pixel font size from `style.fontSizePx`.

## Implementation steps

1. Build `computeDimension` and tests (horizontal/vertical/aligned/angle/area).
2. Build `DimensionRenderer` Konva group; mount in `DimensionsLayer` (filled from earlier placeholder).
3. Build the tool flow with `useDimensionDraw`.
4. Wire `addDimensionCommand` (factory similar to `addDrawingEntityCommand`; add to T08's built-ins set if not already).
5. Tests for `computeDimension`:
   - Horizontal of two points returns `|x2 - x1|` and aligns midpoint horizontally.
   - Vertical likewise.
   - Aligned uses Euclidean distance.
   - Angle returns degrees between arms (0..180).
   - Broken reference returns null.

## Commands needed

- `addDimensionCommand({ dimension: DimensionEntity })`
- `updateDimensionCommand({ id, patch })`
- `deleteDimensionCommand({ id })`

Add these to `src/domain/commands/builtin/`.

## Decisions

- **`offsetMm`**: positive value means perpendicular offset to the right when walking from `a` to `b`. Document this constant.
- **Dimensions live in `project.dimensions`**, separate from `drawingEntities`, per plan §37.
- **Auto-update**: rendering recomputes on every project change — no caching. Project sizes are small enough in MVP.

## Open questions

- *Should dimensions snap to surface edges?* Yes. Add `surfaceId+edgeIndex` snap targets to the candidate list during tool use (mark as **decided**).

## Acceptance criteria

- [ ] Each dimension type creates a correct annotation with arrows and text.
- [ ] Moving a referenced line updates the dimension text and position.
- [ ] Deleting a referenced entity makes the dimension show `?` placeholder.
- [ ] `textOverride` replaces computed text.
- [ ] Add/update/delete dimension commands are undoable.
- [ ] Tests pass.

## Verification

```
npm test -- src/features/drawingTools/dimension
```

## Progress Log

_(append entries here)_
