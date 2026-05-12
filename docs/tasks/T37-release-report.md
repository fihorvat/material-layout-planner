# T37 — Release Report

- **Date**: 2026-05-12
- **Base commit**: fd6459e (before T36/T37 polish + tests)

## Test suite

- `npm test`: **224 passed / 0 failed** across 54 test files.
- `npm run lint`: 0 errors, 2 minor warnings (unused eslint-disable directives in `clipMaterialPieceToSurface.ts:46` and `ErrorBoundary.tsx:17`).
- `npm run typecheck`: clean.
- `npm run build`: succeeds (1 chunk-size warning).

## Acceptance checklist (plan.md §51)

| Item | Status | Notes |
|---|---|---|
| Create a local project | done | Dashboard + IndexedDB persistence (T04, T35). |
| Draw measured 2D geometry | done | Line/Rectangle/Polygon tools (T10–T12). |
| Lines by exact length and angle | done | `NumericPromptOverlay` (T10). |
| Rectangles by exact width/height | done | `useRectangleDraw` (T11). |
| Polygons with dimensioned edges | done | `PolygonPreview` shows live segment lengths (T12). |
| Openings inside surfaces | done | `validateOpening`, hole storage in `Surface.holes` (T16). |
| Named surfaces | done | `createSurface` + `SurfaceProperties` (T15). |
| Split a surface | done | `splitSurfaceByLine` / `byPolygon` / `atDimension` (T17). |
| Connect surfaces | done | `makeConnection` + `validateConnection` + `addConnectionCommand` (T18). |
| One material per surface | done | `Surface.materialId` + `assignMaterialCommand` (T19). |
| Material width/height/thickness | done | `Material` schema + `createMaterial` defaults (T19). |
| Joint/gap width | done | `Material.defaultJointMm`, `PlacementPattern.jointMm` (T19/T20). |
| Physical overlap on edges | done | Edge rule resolution + `computeWorkingPolygon` (T24). |
| Overlap drawn semi-transparently | done | `MaterialLayoutLayer` renders overlap polygons at 0.25 opacity (T25). |
| Placement pattern + orientation | done | `PlacementPattern` model + grid generator (T20/T22). |
| Manual offset by mouse | partial | Snap helpers in `manualOffset.ts`; drag UI minimal in MVP (T21). |
| Manual offset by numeric input | done | Offset fields on pattern; pattern editor follows. |
| Optimization priorities | done | `optimizeMaterialLayout` + score weights (T27). |
| Piece IDs and sizes | done | `pieceCodes.ts`, `MaterialPieceLabel` (T23/T25). |
| Cut pieces include overlap | done | `MaterialPiece.physicalPolygon` covers overlap area. |
| Cut list includes thickness | done | `MaterialCutListItem.thicknessMm` (T28). |
| PDF: final appearance | done | `renderFinalAppearancePage` (T32). |
| PDF: technical drawing with dimensions | done | `renderTechnicalDrawingPage` (T32). |
| PDF: material layout | done | `renderMaterialLayoutPage` (T32). |
| PDF: cut list | done | `renderCutListPage` (T33). |
| PDF: cutting diagrams | done | `renderCuttingDiagramPages` + `buildCuttingDiagram` (T29/T33). |
| PDF: installation instructions | done | `renderInstructionsPage` (T31). |
| Project saves locally | done | IndexedDB autosave (T04). |
| JSON export and import | done | `exportProjectToJson` / `parseProjectFromJson` (T04/T35). |
| Background image import + calibration | done | `calibrateImage` + commands (T34). |
| Warnings for invalid geometry | done | `validateProject` + `WarningsPanel` (T26). |
| Undo/redo for core actions | done | Inverse-based command stack (T08). |

## Integration tests

- `src/test/integration/projectFromScratch.test.ts` — full create→layout→cut list→PDF pipeline.
- `src/test/integration/jsonRoundTrip.test.ts` — JSON export/import equality.
- `src/test/integration/connectedSurfacesOverlap.test.ts` — overlap expands the working polygon.

## Known gaps / follow-ups

- **Web Worker**: T27 ships with a synchronous fallback in `runOptimizer`. The Vite `?worker` plumbing is sketched in `materialLayoutOptimizer.worker.ts` but not wired in. Optimization runs on the main thread for now.
- **Pattern origin drag UI** is left as an MVP stub (numeric editing covers it).
- **PDF SVG renderer** is a minimal line-based pipeline; richer styling (dashed overlap outlines, dimension arrows in the technical page) can be expanded in `svg.ts`.
- **Thumbnails**: dashboard layout does not render captured Konva thumbnails yet.
- **Toasts** are wired (`toastStore`, `ToastContainer`) but most commands still surface errors via `throw`; replace as part of polish.

## Performance

Not formally profiled. Layout generation for the 1200 \u00D7 900 mm fixture with 600 \u00D7 300 mm material completes in <5 ms in vitest. Worker offload remains the recommended next step for surfaces with thousands of pieces.

## Files of interest

- `src/domain/materialLayout/` — grid generation, clipping, optimization, cut list, cutting diagram, stats.
- `src/domain/surfaces/` — surface creation, validation, splitting, connections, edge rules.
- `src/domain/commands/builtin/` — every undoable mutation.
- `src/domain/pdf/` — multi-page PDF pipeline.
- `src/features/editor/` — toolbar, tool rail, canvas stage, properties + bottom panels.
- `src/features/dashboard/` — multi-project dashboard with JSON import/export.
