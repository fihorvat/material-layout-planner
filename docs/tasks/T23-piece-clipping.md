# T23 — Piece clipping (physical + visible)

- **Milestone**: M5
- **Depends on**: T07, T22
- **Status**: todo

## Goal

Take the un-clipped `UnitRectangle` grid from T22 and produce the final `MaterialPiece` objects per plan §21 / §23.3: clip to physical working zone, clip to visible surface, compute overlap polygons, assign codes.

## Files

```
src/domain/materialLayout/clipMaterialPieceToSurface.ts
src/domain/materialLayout/buildMaterialLayout.ts
src/domain/materialLayout/pieceCodes.ts
src/domain/materialLayout/__tests__/clipMaterialPieceToSurface.test.ts
src/domain/materialLayout/__tests__/buildMaterialLayout.test.ts
```

## `clipMaterialPieceToSurface`

```ts
export const clipMaterialPieceToSurface = (input: {
  unit: UnitRectangle;
  visibleSurfacePolygon: Polygon;        // outer + holes
  physicalWorkingPolygon: Polygon;       // expanded by overlap allowances (T24)
  material: Material;
}): {
  visiblePolygon: Point2D[] | null;      // null if fully outside visible
  physicalPolygon: Point2D[] | null;
  overlapPolygons: Point2D[][];          // physical - visible
  boundingWidthMm: number;
  boundingHeightMm: number;
} | null;
```

Algorithm:

1. Compute `physical = polygonIntersection(unit.cornersPolygon, physicalWorkingPolygon)`. If empty → return null (piece unused).
2. Compute `visible = polygonIntersection(physical, visibleSurfacePolygon)`. If empty → return null.
3. Compute `overlap = polygonDifference(physical, visible)`.
4. Compute axis-aligned bounding box of `physical` in *unit-local* coords (rotate back by `-unit.rotationDeg`) to derive `boundingWidthMm` / `boundingHeightMm`.

If `polygonIntersection` returns multiple parts (rare with rectangles), keep the largest. Discard near-zero areas (`< 1 mm²`).

## `pieceCodes.ts`

```ts
export const buildPieceCode = (params: { surfaceLetter: string; index: number }): string;
// returns 'A-01', 'A-02', ..., 'B-01' etc.

export const buildSurfaceLetter = (surfaceIndex: number): string;
// 0 -> 'A', 25 -> 'Z', 26 -> 'AA' ...
```

Piece codes are stable for a single layout generation, not globally stable across regenerations.

## `buildMaterialLayout`

```ts
export const buildMaterialLayout = (input: {
  surface: Surface;
  surfaceIndex: number;
  material: Material;
  pattern: PlacementPattern;
  edgeRules: EdgeRule[];
  connections: SurfaceConnection[];
  visibleSurfacePolygon: Polygon;
  physicalWorkingPolygon: Polygon;
}): MaterialLayout;
```

Steps:

1. Generate grid via `generatePlacementGrid` (T22).
2. For each `UnitRectangle`:
   - Run `clipMaterialPieceToSurface`.
   - If null → skip.
   - Build `MaterialPiece`:
     ```ts
     {
       id: newId(),
       surfaceId: surface.id,
       materialId: material.id,
       pieceCode: buildPieceCode({ surfaceLetter, index }),
       sourceUnitIndex: undefined,        // assigned by cutting diagram (T29)
       physicalPolygon, visiblePolygon, overlapPolygons,
       boundingWidthMm, boundingHeightMm, thicknessMm: material.thicknessMm,
       rotationDeg: unit.rotationDeg,
       isFullUnit: pieceMatchesUnit(unit, physicalPolygon),
       isCutPiece: !isFullUnit,
       isIrregular: !isRectangularPolygon(physicalPolygon, eps),
       labelPosition: polygonCentroid(visiblePolygon ?? physicalPolygon),
       warnings: [],     // populated by T26
     }
     ```
3. Compose `MaterialLayout` with `settingsSnapshot` (deep-cloned material, pattern, edgeRules) and empty `stats` (filled by T30).

## Implementation steps

1. Implement `clipMaterialPieceToSurface` + tests:
   - Fully inside surface → physical === visible === unit, no overlap.
   - Half outside (no overlap allowance) → visible = clipped, physical = visible.
   - With expanded physical zone → physical larger than visible; overlap = annulus polygon.
2. Implement `pieceCodes`.
3. Implement `buildMaterialLayout` (without edge rules yet — defer to T24 for the working zone expansion).
4. Tests:
   - 1200 × 900 surface, 600 × 300 material, no joints, no overlap → 6 pieces, all full units.
   - With a 100 × 100 hole in the middle → pieces overlapping the hole are split / lose area; verify the piece over the hole has correct visible/physical/overlap arithmetic.
   - Bounding sizes match unit dims for full pieces and the cut width for clipped pieces.

## Decisions

- **Full-unit detection** uses an area comparison with `eps` of 0.5 mm² because numerical clipping may shave a hair.
- **Irregular detection**: a piece is irregular if its `physicalPolygon` is not a 4-vertex axis-aligned-after-unrotation rectangle within `eps`.
- **`labelPosition` uses visible polygon centroid** so labels stay on-surface; falls back to physical centroid when visible is missing (shouldn't happen since null pieces are skipped).

## Open questions

_(none)_

## Acceptance criteria

- [ ] Pieces are produced with correct visible, physical, and overlap polygons.
- [ ] `isFullUnit` and `isCutPiece` flags correct.
- [ ] Holes in the surface are honored.
- [ ] Layout has correct `settingsSnapshot`.
- [ ] Tests pass.

## Verification

```
npm test -- src/domain/materialLayout
```

## Progress Log

_(append entries here)_
