# T27 — Optimization engine (Web Worker)

- **Milestone**: M6
- **Depends on**: T25, T26
- **Status**: todo

## Goal

Score multiple candidate layouts per surface and pick the best one, balancing waste, symmetry, cut count, small pieces, and joint alignment per user priorities (plan §19). Run in a Web Worker so the UI stays responsive.

## Files

```
src/domain/materialLayout/scoreMaterialLayout.ts
src/domain/materialLayout/optimizeMaterialLayout.ts        (replaces T25 stub)
src/domain/materialLayout/__tests__/scoreMaterialLayout.test.ts
src/domain/materialLayout/__tests__/optimizeMaterialLayout.test.ts
src/workers/materialLayoutOptimizer.worker.ts
src/workers/materialLayoutOptimizerClient.ts
src/features/placementPatterns/OptimizationPanel.tsx       (extended)
```

## `scoreMaterialLayout.ts`

```ts
export type LayoutScore = {
  total: number;
  parts: {
    waste: number;
    cutCount: number;
    smallPiece: number;
    asymmetry: number;
    jointMisalignment: number;
  };
};

export const scoreMaterialLayout = (input: {
  layout: MaterialLayout;
  surface: Surface;
  material: Material;
  priority: OptimizationPriority;
  context?: { connectedLayouts?: MaterialLayout[] };  // for joint alignment
}): LayoutScore;
```

Score components:

- `waste` = `(purchasedAreaMm2 - physicalAreaMm2) / physicalAreaMm2`.
- `cutCount` = number of pieces with `isCutPiece === true`.
- `smallPiece` = count of pieces with `boundingWidthMm < material.minPieceWidthMm || boundingHeightMm < material.minPieceHeightMm`.
- `asymmetry` = sum of distances between the surface's vertical/horizontal centerline and the nearest joint line (0 when joints fall on the centerline). Symmetry mode controls which axes apply.
- `jointMisalignment` = average distance of joint endpoints from the matched joint of `connectedLayouts` across shared edges (0 when patterns align). Only computed if `jointAlignmentWeight > 0`.

Total:

```
total = waste * wasteWeight
      + cutCount * cutCountWeight
      + smallPiece * smallPieceWeight
      + asymmetry * symmetryWeight
      + jointMisalignment * jointAlignmentWeight
```

## `optimizeMaterialLayout`

```ts
export type OptimizeInput = {
  surface: Surface;
  surfaceIndex: number;
  material: Material;
  pattern: PlacementPattern;
  edgeRules: EdgeRule[];
  connections: SurfaceConnection[];
  visibleSurfacePolygon: Polygon;
  physicalWorkingPolygon: Polygon;
  priority: OptimizationPriority;
  context?: { connectedLayouts?: MaterialLayout[] };
};

export const optimizeMaterialLayout = (input: OptimizeInput): { layout: MaterialLayout; score: LayoutScore; variation: string };
```

Algorithm:

1. If `priority.manualOffsetLocked === true`: build one layout with the user's pattern and return it as the winner with score recorded (no search).
2. Else: call `generateMaterialCandidates` (T22). For each candidate:
   - `buildMaterialLayout` (T23) using its modified pattern.
   - `scoreMaterialLayout`.
3. Pick the lowest `total`. Return it with the variation tag.

## Web Worker

`materialLayoutOptimizer.worker.ts` exposes:

```ts
self.onmessage = (e) => {
  const { id, request } = e.data as { id: string; request: OptimizeInput[] };
  const results = request.map(optimizeMaterialLayout);
  self.postMessage({ id, results });
};
```

`materialLayoutOptimizerClient.ts` is a small Promise-based wrapper:

```ts
export const runOptimizer = (request: OptimizeInput[]): Promise<OptimizeResult[]>;
```

It re-uses a single Worker instance, queues requests with unique IDs, and resolves on response.

## Integration

Replace T25's stub in `optimizeMaterialLayout.ts`. The "Generate layout" toolbar button now:

1. Builds an `OptimizeInput[]` for all eligible surfaces.
2. Calls `runOptimizer` → awaits results.
3. Dispatches `setMaterialLayoutsCommand({ layouts })`.

Show a progress indicator in the toolbar while running ("Optimizing…").

## Implementation steps

1. Build `scoreMaterialLayout` + tests:
   - Stacked layout perfectly tiling: `waste = 0`, `cutCount = 0`, `smallPiece = 0`.
   - Symmetric layout on a centered surface: `asymmetry ≈ 0`.
2. Build `optimizeMaterialLayout` + tests on small fixtures (assert the chosen variation matches the lowest score).
3. Build the worker and client.
4. Replace the stub.
5. Update the toolbar with progress state.

## Decisions

- **Joint alignment is per-pair**: compute against each connected layout. Skipping is acceptable when `jointAlignmentWeight === 0`.
- **No simulated annealing / genetic search in MVP**. Plain enumeration of bounded candidates (≤ 16) is enough.
- **Optimization is synchronous in the worker**, not interruptible. If the operation exceeds 2 s, log a warning; UI must remain responsive because it's off main thread.
- **Manual lock skips search** entirely to honor user intent.

## Open questions

_(none)_

## Acceptance criteria

- [ ] Optimizer returns a layout for each input.
- [ ] Manual offset locked: returned layout has the user's exact `offsetXmm/Y`.
- [ ] Scoring function is deterministic and matches test fixtures.
- [ ] UI does not freeze during optimization (use worker).
- [ ] "Optimizing…" indicator appears and clears.
- [ ] Tests pass.

## Verification

```
npm test -- src/domain/materialLayout/__tests__/scoreMaterialLayout.test.ts \
            src/domain/materialLayout/__tests__/optimizeMaterialLayout.test.ts
npm run dev   # manual: heavy surface optimize without UI freeze
```

## Progress Log

_(append entries here)_
