# T02 — Type system & domain models

- **Milestone**: M1
- **Depends on**: T01
- **Status**: review

## Goal

Define every persistent data type used by the application as Zod schemas with inferred TypeScript types. This is the single source of truth for `Project` shape, used by stores, storage, JSON import/export, and the layout engine.

## Deliverables

A complete, validated type module per the spec in `docs/plan.md` (sections 9–17, 25, 37). Every type listed below must exist as a Zod schema **and** an inferred TS type.

### Files to create

```
src/types/geometry.ts
src/types/style.ts
src/types/drawing.ts
src/types/dimension.ts
src/types/label.ts
src/types/surface.ts
src/types/surfaceConnection.ts
src/types/material.ts
src/types/placementPattern.ts
src/types/edgeRule.ts
src/types/materialLayout.ts
src/types/pdf.ts
src/types/backgroundImage.ts
src/types/project.ts
src/types/index.ts            (barrel)
src/types/__tests__/project.test.ts
```

### Required schemas

| Schema | Source in plan.md | Notes |
|---|---|---|
| `Point2DSchema` | §37 | `{ x: number, y: number }` finite. |
| `DrawingStyleSchema` | §30 | Optional `strokeDash`, `fillColor`, `fillOpacity`. |
| `DimensionStyleSchema` | §9.6 | Reuse `DrawingStyleSchema` fields + `arrowSize`, `textOffsetMm`. |
| `TextStyleSchema` | §9.7 | `fontSizePx`, `textColor`, `bold`, `italic`. |
| `MaterialStyleSchema` | §14 | `fillColor`, `labelColor`, `joint`/`gap` color. |
| `SurfaceStyleSchema` | §11 | `strokeColor`, `strokeWidthPx`, `fillColor`, `fillOpacity`, `textColor`. |
| `LineEntitySchema` | §9.2 | Discriminated by `type: "line"`. |
| `RectangleEntitySchema` | §9.3 | Discriminated by `type: "rectangle"`. |
| `PolygonEntitySchema` | §9.4 | Discriminated by `type: "polygon"`. |
| `DrawingEntitySchema` | — | `z.discriminatedUnion("type", [...])`. |
| `DimensionReferenceSchema` | §9.6 | `{ kind: "point" \| "line" \| "edge" \| "entity"; id: string; pointIndex?: number }`. |
| `DimensionEntitySchema` | §9.6 | enum dimensionType, optional `textOverride`, `offsetMm`. |
| `LabelEntitySchema` | §9.7 | Anchor enum + optional `anchorId`. |
| `EdgeRuleSchema` | §20 | Includes `overlapOpacity` (0..1) and thickness fields. |
| `SurfaceConnectionRefSchema` | §13 | `{ connectionId: string }` (lightweight ref stored on Surface). |
| `SurfaceConnectionSchema` | §13 | Full connection record. |
| `SurfaceSchema` | §11 | Includes `outerBoundary`, `holes`, refs. |
| `MaterialSchema` | §14 | Includes thickness, defaults. |
| `PlacementPatternSchema` | §17 | Includes optimization priority embedded. |
| `OptimizationPrioritySchema` | §19 | All five weights + `manualOffsetLocked`. |
| `MaterialPieceWarningSchema` | §21 | `{ code: string; messageKey: string; severity: "info" \| "warning" \| "error" }`. |
| `MaterialPieceSchema` | §21 | Visible/physical/overlap polygons. |
| `MaterialLayoutStatsSchema` | §25 | All numeric stats. |
| `MaterialLayoutSchema` | §25 | Includes `settingsSnapshot`. |
| `BackgroundImageRefSchema` | §32 | `{ id, dataUrl?, blobKey?, position, rotationDeg, scaleMmPerPx, opacity01, locked, visible, calibration }`. |
| `PdfExportSettingsSchema` | §39 | All include flags. |
| `ProjectSettingsSchema` | §37 | Grid, snap, defaults. |
| `ProjectSchema` | §37 | Top-level. Add `schemaVersion: z.literal(1)`. |

### Constraints to enforce in schemas

- All `*Mm` and `*Px` fields: `z.number().finite().nonnegative()` (use `.gt(0)` where zero is invalid, e.g., `unitWidthMm`).
- All `opacity`/`*01` fields: `z.number().min(0).max(1)`.
- All `angleDeg`: `z.number().finite()` (no range — allow negative).
- All `id` fields: `z.string().min(1)`.
- `Point2DSchema`: both `x` and `y` finite.
- `outerBoundary`: `z.array(Point2DSchema).min(3)`.
- `holes`: `z.array(z.array(Point2DSchema).min(3))`.
- Enums via `z.enum([...])`, not `z.union`.

### Type exports

For every schema `XxxSchema`, export `type Xxx = z.infer<typeof XxxSchema>`. Re-export everything from `src/types/index.ts`.

### Default-value factories

In `src/types/defaults.ts`, export pure functions:

```ts
export const defaultDrawingStyle = (): DrawingStyle => ({ ... });
export const defaultSurfaceStyle = (): SurfaceStyle => ({ ... });
export const defaultMaterialStyle = (): MaterialStyle => ({ ... });
export const defaultProjectSettings = (): ProjectSettings => ({
  gridSizeMm: 50,
  snapEnabled: true,
  snapTolerancePx: 8,
  defaultLineColor: '#1f2937',
  defaultTextColor: '#111827',
  defaultOverlapOpacity: 0.25,
  autosaveEnabled: true,
});
export const defaultPdfSettings = (): PdfExportSettings => ({ /* all includes true, A4 portrait, scale auto */ });
export const defaultOptimizationPriority = (): OptimizationPriority => ({
  wasteWeight: 1, symmetryWeight: 1, cutCountWeight: 1,
  smallPieceWeight: 2, jointAlignmentWeight: 0, manualOffsetLocked: false,
});
export const createEmptyProject = (name: string): Project => ({ /* full valid project */ });
```

`createEmptyProject` must produce a `Project` that passes `ProjectSchema.safeParse` cleanly.

## Implementation steps

1. Create each file listed above, top-down (start with `geometry.ts`, `style.ts`).
2. Use Zod's `z.object(...).strict()` to forbid unknown fields and catch schema drift early.
3. Re-export from `src/types/index.ts`.
4. Add `src/types/defaults.ts` with the factories above.
5. Write `src/types/__tests__/project.test.ts`:
   - `ProjectSchema.parse(createEmptyProject('test'))` does not throw.
   - Mutating a required field (e.g., missing `name`) makes `safeParse` fail.
   - Round-trip: `ProjectSchema.parse(JSON.parse(JSON.stringify(createEmptyProject('test'))))` deep-equals the original.
   - `schemaVersion === 1`.
   - Setting `outerBoundary` to 2 points fails parsing.

## Decisions (answered)

- **Discriminated unions for `DrawingEntity`** so TS narrows on `entity.type`.
- **`outerBoundary` stored as an array of points** (not as Line entities) — points define a closed polygon by convention; the closing edge is implicit (`points[last] -> points[0]`).
- **Holes stored on the Surface**, not as separate `Opening` entities in MVP. An `Opening` from the UI (T16) becomes a hole entry on its parent surface plus optional drawing entities for visualization.
- **`MaterialPiece.physicalPolygon` vs `visiblePolygon`**: physical includes overlap; visible is clipped to the surface. `overlapPolygons` are the geometric difference, persisted so PDF/export can re-render without recomputation.
- **`schemaVersion: 1`** is hard-coded at v1; T04 owns migrations.
- **`BackgroundImageRef` blob storage**: the image binary lives in IndexedDB under `blobKey`; the schema only stores the key plus calibration. Inline `dataUrl` is optional and used only for small thumbnails / fallback.
- **No `groutMm` anywhere.** Use `jointMm` / `defaultJointMm` per plan §16.

## Open questions

_(none — record any new question discovered while implementing)_

## Acceptance criteria

- [x] All schemas in the table above exist and are exported.
- [x] Every schema has a corresponding inferred TS type re-exported.
- [x] `defaults.ts` factories produce values that pass their schema's `parse`.
- [x] `__tests__/project.test.ts` passes.
- [x] `npm run lint`, `npm run typecheck`, `npm test` all green.
- [x] No `any` and no `@ts-ignore` in `src/types/**`.

## Verification

Ran locally on Windows (Node v24.15.0, npm 11.12.1):

- `npm run typecheck` (`tsc -b --noEmit`) → exit 0.
- `npm run lint` (`eslint .`) → exit 0, no findings.
- `npm test` (`vitest run`) → 2 files, 8 tests passed, exit 0.

## Progress Log

### 2026-05-12 19:10 — Cascade
- status: review
- summary: implemented all Zod schemas (geometry, style, drawing, dimension, label, edgeRule, surfaceConnection, surface, material, placementPattern, materialLayout, backgroundImage, pdf, project) with inferred TS types and `.strict()` objects; added `defaults.ts` with style/settings/PDF/optimization factories plus `createEmptyProject`; barrel `src/types/index.ts` re-exports everything; added `src/types/__tests__/project.test.ts` covering empty-project parse, JSON round-trip, schemaVersion, strict() rejection, and surface boundary min-length.
- commits: uncommitted
- next: human review of T02, then proceed to T03 (state management).
- blockers: none

## Implementation notes

- `SurfaceConnection.edgeAId` / `edgeBId` are kept as `string` per `plan.md` §13 (encoding format left to T18). `EdgeRule.edgeIndex` remains `number` per `plan.md` §20.
- `MaterialLayout.settingsSnapshot` is extracted into its own `MaterialLayoutSettingsSnapshotSchema` so it can be reused by exporters without restating the shape inline.
- `BackgroundImageRef.calibration` is a separate strict object (`pointAPx`, `pointBPx`, `distanceMm`) and is nullable so an imported-but-uncalibrated image is representable.
- Offset-style `*Mm` fields (`offsetXmm`, `offsetYmm`, `rowOffsetMm`, `textOffsetMm`, `Point2D.x/y`) are `z.number().finite()` (signed) instead of `nonnegative()`; positions and offsets are legitimately signed. The conventions rule about non-negative `*Mm` was applied to size-like fields only.
- `MaterialStyle.jointColor` is the abstract joint/gap color per `plan.md` §16; the field deliberately avoids `grout` naming.
- All object schemas use `.strict()` to catch schema drift at the JSON boundary.
