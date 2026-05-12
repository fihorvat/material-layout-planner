# T29 — Cutting diagrams

- **Milestone**: M7
- **Depends on**: T28
- **Status**: todo

## Goal

Produce per-source-material-unit cutting diagrams that show how each pieces is obtained from a full material unit, plus offcut leftovers. Plan §27.

## Files

```
src/domain/materialLayout/materialCuttingDiagram.ts
src/domain/materialLayout/__tests__/materialCuttingDiagram.test.ts
src/features/materialLayout/CuttingDiagramView.tsx
```

## `materialCuttingDiagram.ts`

```ts
export type CuttingDiagram = {
  materialId: string;
  units: SourceUnit[];
};
export type SourceUnit = {
  index: number;                  // 1-based, per-material
  pieces: SourcePieceCut[];
  offcut?: { widthMm: number; heightMm: number };  // remaining rectangle, if rectangular
  notes: string[];
};
export type SourcePieceCut = {
  pieceCode: string;
  surfaceId: string;
  widthMm: number;
  heightMm: number;
  positionInUnitMm: Point2D;      // top-left position within the unit rectangle
  isIrregular: boolean;
};

export const buildCuttingDiagram = (project: Project, materialId: string): CuttingDiagram;
```

Algorithm (simple greedy bin-packing per material; saw kerf ignored per plan §27):

1. Collect all pieces using this material, sorted full-units-first then by descending area.
2. For each piece:
   - If a full unit, assign one new source unit; mark it consumed.
   - If a cut piece (rectangular, dimensions ≤ unit dims) attempt to fit it into an existing partial unit using next-fit decreasing height:
     - Each partial unit tracks a remaining rectangle (start as full unit minus already-placed pieces).
     - If the cut fits in the remaining rectangle, place it at the rect's top-left and shrink the remaining rectangle by the placed piece (using the simple "guillotine right then below" split — choose the split with the largest leftover area).
     - Otherwise, open a new source unit.
   - If the piece is irregular: assign a fresh source unit with note "Cut by template — original piece dimensions: …".
3. Assign `sourceUnitIndex` on each `MaterialPiece` (mutate or return mapping). Persist only the mapping; pieces stay immutable in MVP.

## `CuttingDiagramView`

For each source unit:

- Render the unit rectangle to scale (configurable per-page in the PDF; on-screen, fit to panel).
- Draw each piece's rectangle with code label.
- Show offcut area filled with a light hatching pattern.
- Notes listed below.

Bottom-panel "Cut list" tab gets a sub-tab "Diagrams" toggling between grouped table (T28) and per-unit diagram (T29).

## Implementation steps

1. Build `buildCuttingDiagram` + tests:
   - Six 600 × 300 full units → six source units, one piece each, no offcut.
   - One 600 × 300 unit cut into 400 × 300 and 200 × 300 → one source unit with both pieces and zero offcut.
   - 600 × 300 unit cut at 323 × 300 (with overlap included) → 277 × 300 offcut.
   - One irregular piece → its own source unit with template note.
2. Build `CuttingDiagramView` and wire bottom-panel sub-tab.

## Decisions

- **Greedy guillotine packing**, not optimal bin-packing. MVP scope per plan §27. Acceptable inefficiency is documented in notes.
- **No saw-kerf** in MVP. Schema includes `bladeKerfMm?` as optional disabled field.
- **Irregular = its own source unit** since template cutting is destructive; you can't reuse the unit for another piece.

## Open questions

_(none)_

## Acceptance criteria

- [ ] Per-material cutting diagram produced.
- [ ] Pieces packed into source units correctly.
- [ ] Offcut dimensions accurate.
- [ ] Irregular pieces flagged separately.
- [ ] View renders in bottom panel.
- [ ] Tests pass.

## Verification

```
npm test -- src/domain/materialLayout/__tests__/materialCuttingDiagram.test.ts
```

## Progress Log

_(append entries here)_
