# T30 — Waste calculation & layout stats

- **Milestone**: M7
- **Depends on**: T25
- **Status**: todo

## Goal

Compute `MaterialLayoutStats` for each layout and aggregate project-level stats. Display them in the bottom-panel "Stats" tab and feed into the PDF summary page.

## Files

```
src/domain/materialLayout/layoutStats.ts
src/domain/materialLayout/__tests__/layoutStats.test.ts
src/features/materialLayout/ProjectStatsPanel.tsx
```

## `layoutStats.ts`

```ts
export const computeLayoutStats = (layout: MaterialLayout, material: Material, cuttingDiagram?: CuttingDiagram): MaterialLayoutStats;
export const computeProjectStats = (project: Project, cuttingDiagrams: Record<string, CuttingDiagram>): ProjectStats;

export type ProjectStats = {
  totalVisibleAreaMm2: number;
  totalPhysicalAreaMm2: number;
  totalPurchasedAreaMm2: number;
  totalFullUnits: number;
  totalCutPieces: number;
  totalPieces: number;
  totalWasteAreaMm2: number;
  totalWastePercent: number;
  perMaterial: Array<{
    materialId: string;
    materialName: string;
    fullUnits: number;
    cutPieces: number;
    purchasedAreaMm2: number;
    wasteAreaMm2: number;
    wastePercent: number;
  }>;
};
```

Per-layout calculations follow plan §28 definitions:

- `visibleAreaMm2` = sum of `polygonArea(visiblePolygon)` over pieces.
- `physicalMaterialAreaMm2` = sum of `polygonArea(physicalPolygon)` over pieces.
- `purchasedMaterialAreaMm2`:
  - If `cuttingDiagram` provided: `cuttingDiagram.units.length * material.unitWidthMm * material.unitHeightMm`.
  - Else: `fullUnitCount * unitArea + sum over cut pieces of unitArea` (worst case: each cut piece consumes one whole unit). Mark this as estimated.
- `fullUnitCount` / `cutPieceCount` / `totalPieceCount`: piece flags.
- `wasteAreaMm2` = `purchasedMaterialAreaMm2 - physicalMaterialAreaMm2`.
- `wastePercent` = `wasteAreaMm2 / purchasedMaterialAreaMm2 * 100`.
- `uniqueCutCount` = distinct `(roundedW, roundedH, isIrregular)` triples among cut pieces.
- `smallPieceCount` = pieces under min thresholds.

Stats are persisted into `MaterialLayout.stats` whenever a layout is built (T25 caller must call this and embed). Re-runnable for any layout.

## `ProjectStatsPanel`

Bottom-panel "Stats" tab. Sections:

- Project summary (total visible/physical/purchased/waste, total pieces).
- Per-material breakdown table.
- Per-surface breakdown collapsible list.

Values formatted with `formatLength` (areas use `mm²` / `cm²` / `m²` auto-scaling via a sibling `formatArea` helper).

## `formatArea`

```ts
export const formatArea = (mm2: number, opts?: { unit?: 'mm2' | 'cm2' | 'm2' | 'auto'; decimals?: number }): string;
```

`auto`: pick the smallest unit whose displayed value is ≥ 1.

## Implementation steps

1. Build `layoutStats.ts` + tests using fixtures from T23.
2. Build `formatArea` in `domain/units/`.
3. Update T25's `buildMaterialLayout` (or its caller) to set `layout.stats` after construction.
4. Build `ProjectStatsPanel` and mount in bottom-panel "Stats" tab.

## Decisions

- **Purchased area uses the cutting diagram count when available** because it's the true material consumption. Without the diagram, fall back to a worst-case estimate and flag it.
- **Stats are persisted on layout** so PDFs see them deterministically, identical to T29's diagrams.

## Open questions

_(none)_

## Acceptance criteria

- [ ] Per-layout stats match analytic expectations for fixture inputs.
- [ ] Project-level aggregation correct.
- [ ] Stats panel displays human-readable values.
- [ ] `formatArea` auto-picks sensible units.
- [ ] Tests pass.

## Verification

```
npm test -- src/domain/materialLayout/__tests__/layoutStats.test.ts
```

## Progress Log

_(append entries here)_
