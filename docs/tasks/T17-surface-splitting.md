# T17 — Surface splitting

- **Milestone**: M3
- **Depends on**: T15
- **Status**: todo

## Goal

Provide a Split Surface tool that divides one surface into two or more named surfaces using a line, rectangle, polygon, or "split at dimension" input. This is the canonical way to apply two different materials on what visually looks like one wall.

## Methods (plan §12)

1. **Split by line** — a straight line from edge to edge; cuts surface into 2 parts.
2. **Split by polyline** — multi-segment cut, must enter and exit the surface, creating 2 parts.
3. **Split by rectangle** — extracts an inner rectangular region as a new surface; original becomes a frame.
4. **Split by polygon** — same as rectangle but arbitrary shape.
5. **Split at exact dimension** — choose an edge, enter a distance; cut perpendicular to that edge at the specified offset.
6. **Split by selected construction line** — pick an existing line entity that crosses the surface; use as the cut.

## Files

```
src/features/surfaces/SplitSurfaceTool.tsx
src/features/surfaces/split/useSplitDraw.ts
src/features/surfaces/split/SplitPreview.tsx
src/domain/surfaces/splitSurface.ts
src/domain/surfaces/__tests__/splitSurface.test.ts
src/domain/commands/builtin/splitSurfaceCommand.ts
```

## `splitSurface.ts`

Pure functions:

```ts
type SplitResult = {
  parts: Surface[];           // 2+ resulting surfaces
  issues: { code: string; message: string }[];
};

export const splitSurfaceByLine = (
  surface: Surface,
  cut: { a: Point2D; b: Point2D },
  opts: { namePrefix?: string }
): SplitResult;

export const splitSurfaceByPolygon = (
  surface: Surface,
  inner: Point2D[],
  opts: { mode: 'extractInner' | 'subtractInner'; namePrefix?: string }
): SplitResult;

export const splitSurfaceAtDimension = (
  surface: Surface,
  edgeIndex: number,
  offsetMm: number,
  opts: { perpendicular: boolean; namePrefix?: string }
): SplitResult;
```

Implementation uses `polygonDifference` / `polygonIntersection` from T07. New surfaces:

- Inherit `style`, `showName`, `showDimensions`, `showArea` from the source.
- Inherit `materialId` and `placementPatternId` per the original (user can change later).
- `edgeRules` are dropped (edges changed; rules are rebuilt by the user).
- `connections` are dropped on split parts; the user re-creates them.
- Names: `${source.name} A`, `${source.name} B`, etc., unless `namePrefix` provided.

## Command

`splitSurfaceCommand({ sourceId: string, parts: Surface[] })`:

- Apply: remove source, append parts. Returns inverse `unsplitSurfaceCommand({ sourceSnapshot, partIds })` which deletes parts and restores the source.

## Tool flow

1. Select a single surface. Activate Split tool. Sub-toolbar in properties panel: Line / Rectangle / Polygon / Dimension / From construction line.
2. **Line**: click two points; preview a straight cut clipped to the surface. Confirm → commit.
3. **Rectangle/Polygon**: draw an inner region; on commit, ask whether to "extract inner as new surface" (default) or "subtract inner from source".
4. **Dimension**: select an edge of the surface (highlighted on hover), then a dialog asks for the offset (mm) and side (start or end of the edge); preview the perpendicular cut; commit.
5. **From construction line**: list lines that intersect the surface; user picks one; commit cut.

## Implementation steps

1. Build `splitSurface.ts` pure functions and exhaustive tests (rectangle into halves, L-shape splits, dimension splits).
2. Build `splitSurfaceCommand` with inverse.
3. Build the tool with each sub-mode.
4. Edge cases:
   - Cut line that does not cross surface → no-op + warning.
   - Cut producing more than 2 parts (e.g., line through a hole) → return all parts; user names them in a dialog.

## Decisions

- **Source surface is fully deleted** on commit; the inverse restores it. We do not keep ghost references.
- **Material/pattern inheritance**: keep on all parts. Plan §12 lists this as inherited optional; we default to "yes" and let the user reassign.
- **Edge rules dropped**: they refer to specific edge indices that are no longer valid.
- **Connections dropped**: same reason; users re-create them via T18.

## Open questions

_(none)_

## Acceptance criteria

- [ ] Splitting a rectangular surface by a vertical line produces two surfaces with correct geometry and combined area equal to the source.
- [ ] Rectangle-extract mode creates an inner surface plus a frame surface.
- [ ] Dimension split at exact offset works to within 1e-6 mm.
- [ ] Splitting is undoable in one step.
- [ ] Tests pass for every method.

## Verification

```
npm test -- src/domain/surfaces/__tests__/splitSurface.test.ts
```

## Progress Log

_(append entries here)_
