# T33 — PDF cut list & cutting diagram pages

- **Milestone**: M8
- **Depends on**: T31, T28, T29
- **Status**: todo

## Goal

Render the PDF cut list page (plan §38.5) and per-source-unit cutting diagram pages (plan §38.6).

## Files

```
src/domain/pdf/renderMaterialCutListPage.ts
src/domain/pdf/renderCuttingDiagramPage.ts
src/domain/pdf/__tests__/renderMaterialCutListPage.test.ts
src/domain/pdf/__tests__/renderCuttingDiagramPage.test.ts
```

## Cut list page

Single page (paginate if rows overflow). Header: "Material Cut List". Columns:

| Piece codes | Surface | Material | Size | Qty | Thickness | Overlap | Notes |

Build rows from `cutList` (T28). Use `drawTable` from T31. Group visually by material with a sub-heading row; within each material, sort per T28's ordering.

If notes span lines, wrap; row height adjusts. Page break when remaining vertical space < 2 rows of header height.

Footer note: "Sizes reflect physical piece size; overlap is included where indicated."

## Cutting diagram pages

For each material:

- New page titled `Cutting Diagram — ${material.name}`.
- For each `SourceUnit`:
  - Draw the unit rectangle at the page's scale (auto-fit; max 8 units per page in a 2×4 grid; paginate as needed).
  - Inside the rectangle, draw each `SourcePieceCut` with its piece code label.
  - Show the offcut rectangle filled with diagonal hatching, labeled `Offcut: 277 × 300 mm`.
  - If irregular, render placeholder + note `Cut by template (see Material Layout page)`.

Source-unit scale strategy:

- Fit unit so its larger dimension occupies up to 40% of the page width.
- All units on a page share the same scale.
- Show the scale label below the grid.

## Implementation steps

1. Implement `renderMaterialCutListPage.ts`; handle pagination cleanly.
2. Implement `renderCuttingDiagramPage.ts` with multi-unit per page grid.
3. Tests: produce a PDF, assert text content includes expected codes and that the page count is correct for fixture inputs.
4. Integrate into `buildPdfDocument` page list (T31).

## Decisions

- **Multi-unit grid** keeps page count reasonable for projects with dozens of source units.
- **Irregular units share their own page entries** — they read better with the template hint.
- **Per-material chaptering** simplifies the reader's mental model.

## Open questions

_(none)_

## Acceptance criteria

- [ ] Cut list page renders the full grouped table with pagination.
- [ ] Cutting diagram pages render per material with correct unit count.
- [ ] Offcut rectangles visible and labeled.
- [ ] Tests pass.

## Verification

```
npm test -- src/domain/pdf
npm run dev   # manual export and verify content
```

## Progress Log

_(append entries here)_
