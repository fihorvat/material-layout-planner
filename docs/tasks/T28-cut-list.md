# T28 — Cut list & grouping

- **Milestone**: M7
- **Depends on**: T25
- **Status**: todo

## Goal

Generate the project's cut list — a deduplicated, grouped table of physical material pieces that must be cut or installed — and render it in the bottom-panel "Cut list" tab.

## Files

```
src/domain/materialLayout/materialCutList.ts
src/domain/materialLayout/__tests__/materialCutList.test.ts
src/features/materialLayout/MaterialCutListTable.tsx
src/features/materialLayout/MaterialCutListBottomTab.tsx
```

## `materialCutList.ts`

```ts
export const buildCutList = (project: Project): MaterialCutListItem[];
```

`MaterialCutListItem` is from T02. Algorithm:

1. For each `MaterialLayout` in `project.materialLayouts`:
   - For each `MaterialPiece`, key by:
     - `materialId`
     - `physicalSize`: rounded `(boundingWidthMm, boundingHeightMm, thicknessMm)` to nearest 0.1 mm
     - `isIrregular` flag (irregular pieces never group)
     - `surfaceId` (group only within the same surface to keep the cut list installable in order — plan example groups across surfaces but keeping per-surface grouping is friendlier to mason workflow; see Decisions).
2. Aggregate identical pieces into one entry with `pieceCodes: [...]` and `quantity`.
3. Each entry sets:
   - `widthMm` / `heightMm` / `thicknessMm` to the rounded physical size.
   - `isFullUnit` = all source pieces are full units.
   - `isRectangularCut` = none are irregular and at least one is a cut piece.
   - `isIrregularCut` = any are irregular.
   - `overlapIncluded` = any source piece had non-empty `overlapPolygons`.
   - `notes`: list of strings; include `Includes overlap NN mm` (per-edge overlap), `Cut by template` for irregular, `Full units` for full.

Sort entries by surface order, then by `(isFullUnit desc, widthMm desc, heightMm desc)`.

## `MaterialCutListTable`

Columns matching plan §26:

| Piece | Surface | Material | Size | Qty | Thickness | Overlap | Notes |

- "Piece" column shows the first 2 codes plus `+N` if more (`A-01, A-02 +3`).
- Click on a row highlights the corresponding pieces on the canvas (selects them).
- Export buttons: "Copy as CSV" and "Copy as text".

`MaterialCutListBottomTab` wraps the table and adds a per-material summary header.

## Implementation steps

1. Build `buildCutList` + tests:
   - Two full units of the same material/surface → one entry with quantity 2.
   - Two irregular pieces with identical bounding sizes → two entries (irregulars never group).
   - Pieces from different surfaces with same dims → separate entries.
   - Overlap-bearing pieces flag `overlapIncluded` and add note.
2. Build the table component.
3. Wire bottom-panel tab.

## Decisions

- **Per-surface grouping** keeps masonry workflow ordered. Plan §26 example mixes surfaces but groups by name; we group per surface and sort surfaces by user order. Document this choice.
- **Rounding to 0.1 mm** avoids spurious uniqueness from floating-point noise.
- **Click row → select pieces** so the user can verify on the canvas.

## Open questions

_(none)_

## Acceptance criteria

- [ ] Cut list groups identical pieces.
- [ ] Irregular pieces are never grouped.
- [ ] Overlap-bearing pieces are flagged.
- [ ] Notes column populated correctly.
- [ ] Bottom-panel tab shows the table.
- [ ] Tests pass.

## Verification

```
npm test -- src/domain/materialLayout/__tests__/materialCutList.test.ts
```

## Progress Log

_(append entries here)_
