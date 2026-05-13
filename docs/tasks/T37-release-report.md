# T37 — Release Report

- **Date**: 2026-05-12
- **Base commit**: fd6459e (before T36/T37 polish + tests)
- **Updated**: 2026-05-12 (post-release follow-ups: worker wiring, pattern origin drag, dashboard thumbnails, toast adoption)

## Test suite

- `npm test`: **226 passed / 0 failed** across 55 test files.
- `npm run lint`: 0 errors, 2 minor warnings (unused eslint-disable directives in `clipMaterialPieceToSurface.ts:46` and `ErrorBoundary.tsx:17`).
- `npm run typecheck`: clean.
- `npm run build`: succeeds. `materialLayoutOptimizer.worker` now emits as its own chunk (~98 KB); main bundle chunk-size warning remains.

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
| Manual offset by mouse | done | `PatternOriginLayer` renders draggable handles when the Pattern Origin tool (`M`) is active; drag commits via `updatePlacementPatternCommand` with snap. |
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

- **Web Worker**: `runOptimizer` (`src/workers/materialLayoutOptimizerClient.ts`) now dynamically imports `materialLayoutOptimizer.worker.ts` via Vite's `?worker` query and falls back to a synchronous run when `Worker` is unavailable (Vitest/jsdom). The worker is verified by the build emitting a dedicated chunk and is exercised through the `Generate material layout` toolbar action which calls `runOptimizer`.
- **Pattern origin drag UI**: implemented via `PatternOriginLayer` (`src/features/materialLayout/PatternOriginLayer.tsx`). When the Pattern Origin tool is active (`M` shortcut), each surface with a placement pattern gets a draggable Konva handle. Drag delta is snapped (5 mm steps when canvas snap is on) and committed through `updatePlacementPatternCommand` so it remains undoable.
- **Dashboard thumbnails**: `useSaveProject` (`src/features/editor/useSaveProject.ts`) captures a JPEG of the Konva stage via `captureStageThumbnail` (`src/features/editor/canvas/activeStage.ts`) and persists it through `ProjectRepository.putThumbnail`. The dashboard's `ProjectThumbnail` (`src/features/dashboard/DashboardPage.tsx`) hydrates the Blob into an object URL.
- **Toast adoption**: `dispatchCommand` now toasts any command error (re-thrown for callers/tests). Autosave failures push a warning toast instead of a `console.error`. `Save project` is now a first-class toolbar button (`Ctrl+S` + 💾 icon) that pushes success/error toasts.
- **PDF SVG renderer**: still a minimal line-based pipeline; richer styling (dashed overlap outlines, dimension arrows in the technical page) can be expanded in `svg.ts`.

## Performance

Not formally profiled. Layout generation for the 1200 × 900 mm fixture with 600 × 300 mm material completes in <5 ms in vitest. With the worker wired, optimization for many surfaces now runs off the main thread when launched from the editor.

## Files of interest

- `src/domain/materialLayout/` — grid generation, clipping, optimization, cut list, cutting diagram, stats.
- `src/domain/surfaces/` — surface creation, validation, splitting, connections, edge rules.
- `src/domain/commands/builtin/` — every undoable mutation.
- `src/domain/pdf/` — multi-page PDF pipeline.
- `src/features/editor/` — toolbar, tool rail, canvas stage, properties + bottom panels.
- `src/features/dashboard/` — multi-project dashboard with JSON import/export.
