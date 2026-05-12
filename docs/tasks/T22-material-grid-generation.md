# T22 — Material grid generation

- **Milestone**: M5
- **Depends on**: T20
- **Status**: todo

## Goal

Given a surface, a material, and a placement pattern, generate the un-clipped grid of material-unit rectangles that cover the surface's working area. This is step 1 of the layout engine (plan §23.2). Clipping happens in T23.

## Files

```
src/domain/materialLayout/generatePlacementGrid.ts
src/domain/materialLayout/generateMaterialCandidates.ts
src/domain/materialLayout/__tests__/generatePlacementGrid.test.ts
src/domain/materialLayout/__tests__/generateMaterialCandidates.test.ts
src/domain/materialLayout/types.ts
```

## `types.ts`

```ts
export type UnitRectangle = {
  index: { row: number; col: number };
  corners: Point2D[];   // 4 CCW points in world coords
  centerWorld: Point2D;
  widthMm: number;
  heightMm: number;
  rotationDeg: number;
};
```

## `generatePlacementGrid`

Pure function:

```ts
export const generatePlacementGrid = (input: {
  surface: Surface;
  material: Material;
  pattern: PlacementPattern;
  workingAabb: Aabb;      // surface AABB optionally expanded for overlap (provided by T24 caller; default = surface AABB)
}): UnitRectangle[];
```

Algorithm:

1. Decide effective orientation: `pattern.orientation === 'vertical'` swaps `unitWidth`/`unitHeight`; `customAngle` rotates the whole grid by `pattern.angleDeg`.
2. Compute step:
   - `stepX = unitW + jointMm`
   - `stepY = unitH + jointMm`
3. Determine row offset per row based on `pattern.type`:
   - `stacked` / `verticalStacked` → 0
   - `runningBondHalf` → `stepX / 2`
   - `runningBondThird` → `stepX / 3`
   - `customOffset` → `rowOffsetMm` (or compute from `rowOffsetPercent` × unitW)
   - `diagonal` → 0 (rotation applied at end)
4. Compute origin point in world coords via `computeEffectivePatternOrigin` from T21.
5. From the rotated/translated working AABB, compute how far the grid must extend in each direction to cover the AABB plus a 1-unit margin. Iterate rows/cols, applying row offset and direction (`leftToRight` flips column direction, etc.).
6. For each cell, construct a `UnitRectangle` with rotated corners.

## `generateMaterialCandidates`

```ts
export type LayoutCandidate = {
  pattern: PlacementPattern;        // possibly mutated for candidate search
  grid: UnitRectangle[];
  meta: { variation: string };      // e.g., "baseline", "shiftX+halfUnit", "swappedOrientation"
};

export const generateMaterialCandidates = (input: {
  surface: Surface;
  material: Material;
  pattern: PlacementPattern;
  workingAabb: Aabb;
  manualOffsetLocked: boolean;
}): LayoutCandidate[];
```

If `manualOffsetLocked === true`, return a single candidate (the user's exact pattern). Otherwise generate variations per plan §23.2:

- Baseline (as-is).
- `offsetXmm ± stepX/2`
- `offsetXmm ± stepX/4`
- `offsetYmm ± stepY/2`
- Swapped orientation (horizontal ↔ vertical) — only if `pattern.orientation !== 'customAngle'`.
- Direction variations only meaningful when symmetry mode is active.

Cap total candidates at 16. Use deterministic ordering.

## Implementation steps

1. Implement `generatePlacementGrid` for `stacked` (simplest) and exhaustively test against analytic expectations.
2. Add `runningBondHalf` / `runningBondThird` / `customOffset`.
3. Add `verticalStacked` (swap dims).
4. Add `diagonal` (rotate by `angleDeg`).
5. Implement `generateMaterialCandidates`.
6. Tests:
   - A 1200 × 900 mm surface with 600 × 300 mm material, 0 mm joint, stacked: expect 6 unit rectangles (2 cols × 3 rows) tightly tiling.
   - Same with 3 mm joint: expect step 603 × 303 and 6 rectangles still covering AABB plus margin.
   - Running bond half: every even row shifted by `stepX/2`.
   - Manual lock returns one candidate.
   - Candidate variations are unique and bounded.

## Decisions

- **Working AABB** is provided by the caller. T23 will pass surface AABB; T24 will expand it by edge overlaps before calling.
- **Diagonal pattern**: rotation is applied to the grid after generation, around the effective origin. Tests assert one cell's center matches `rotate(...)` of the un-rotated cell center.
- **All output is in world coordinates** — no surface-local frames. This keeps downstream clipping simple.

## Open questions

_(none)_

## Acceptance criteria

- [ ] Grid covers the working AABB with at most one full-unit margin on each side.
- [ ] Step sizes match `(unit + joint)` exactly.
- [ ] Each pattern type produces the expected row-offset.
- [ ] Candidate generator returns a deterministic, bounded set.
- [ ] Tests pass with `1e-6` tolerance.

## Verification

```
npm test -- src/domain/materialLayout/__tests__/generatePlacementGrid.test.ts \
            src/domain/materialLayout/__tests__/generateMaterialCandidates.test.ts
```

## Progress Log

_(append entries here)_
