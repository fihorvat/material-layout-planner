# T15 — Surfaces (create, render, validate, properties)

- **Milestone**: M3
- **Depends on**: T11, T12, T13
- **Status**: todo

## Goal

Let users create named `Surface` objects from existing rectangles, polygons, or by drawing a fresh boundary. Render surfaces on the canvas with optional name, area, and edge dimension labels. Provide a properties panel for surface fields. Validate surface geometry.

## Surface model (recap from T02)

`Surface` has: `id`, `name`, `outerBoundary: Point2D[]`, `holes: Point2D[][]`, `materialId`, `placementPatternId`, `edgeRules`, `connections`, `showName`, `showDimensions`, `showArea`, `style`.

## Creation flows

### Flow A — Convert a drawing entity

1. User selects a rectangle or polygon entity via the Select tool.
2. Right-click → "Convert to surface" (also exposed as a button in properties panel).
3. Modal asks for a name (default `Surface ${n+1}`); on confirm:
   - Build a `Surface` whose `outerBoundary` is the entity's points (rectangles converted to 4 CCW points).
   - Optionally remove the source drawing entity (user choice, default: keep as construction).
   - Dispatch `createSurfaceCommand`.

### Flow B — Draw a new surface boundary

1. Activate `Surface` tool (toolbar `F` shortcut).
2. The tool behaves like the polygon tool but commits to `project.surfaces` directly.
3. On close, prompt for name and create the surface.

## Files

```
src/features/surfaces/SurfaceTool.tsx
src/features/surfaces/SurfaceLayer.tsx          (renderer for all surfaces)
src/features/surfaces/SurfaceProperties.tsx
src/features/surfaces/SurfaceList.tsx           (bottom-panel content)
src/features/surfaces/CreateSurfaceDialog.tsx
src/features/surfaces/useSurfaceDraw.ts
src/domain/surfaces/createSurface.ts
src/domain/surfaces/validateSurface.ts
src/domain/surfaces/surfaceGeometry.ts          (centroid, area, edgeMidpoints, edges)
src/domain/commands/builtin/surfaceCommands.ts  (createSurfaceCommand, updateSurfaceCommand, deleteSurfaceCommand, renameSurfaceCommand)
src/domain/surfaces/__tests__/*.test.ts
src/features/surfaces/__tests__/SurfaceProperties.test.tsx
```

## `surfaceGeometry.ts`

```ts
export const surfaceArea = (s: Surface): number;          // outer area minus all hole areas
export const surfaceCentroid = (s: Surface): Point2D;     // weighted centroid for compound polygon
export const surfaceEdges = (s: Surface): { index: number; a: Point2D; b: Point2D; lengthMm: number; midpoint: Point2D }[];
export const surfaceBoundingBox = (s: Surface): Aabb;
```

## `validateSurface.ts`

Returns the same shape as `validatePolygon` from T07 plus surface-specific issues:

- `outerNotClosed` (always implicit closed; flag if first/last duplicated identically — strip).
- `outerSelfIntersecting`
- `holeOutsideOuter`
- `holeSelfIntersecting`
- `holesOverlap`

## Commands

```ts
createSurfaceCommand({ surface: Surface });
updateSurfaceCommand({ id, patch: Partial<Surface> });
renameSurfaceCommand({ id, name });
deleteSurfaceCommand({ id });
addSurfaceHoleCommand({ surfaceId, hole: Point2D[] });          // used by T16
removeSurfaceHoleCommand({ surfaceId, holeIndex });
updateSurfaceHoleCommand({ surfaceId, holeIndex, hole });
```

All produce correct inverses.

## Rendering — `SurfaceLayer`

For each surface:

- Render outer boundary + holes as a Konva `<Shape>` using `polygon-clipping`'s output or a manual sub-path:
  - `ctx.beginPath()`, draw outer CCW, then each hole CW (per Konva's even-odd fill default).
- Fill from `surface.style.fillColor` with `fillOpacity`.
- Stroke from `surface.style.strokeColor`.
- If `showName`: render text at centroid.
- If `showArea`: render area below the name in m² (e.g., `0.87 m²`).
- If `showDimensions`: render each edge length as a label perpendicular to the edge (use T13 rendering primitives, but inlined since this is automatic).

Selection halo handled by T09's `SelectionOverlay`.

## Properties panel — `SurfaceProperties`

Fields (plan §40.2):

- Name (text input)
- Assigned material (dropdown, populated from `project.materials`; empty until T19)
- Placement pattern (dropdown, populated from `project.placementPatterns`; empty until T20)
- Show name (checkbox)
- Show dimensions (checkbox)
- Show area (checkbox)
- Line color, fill color, fill opacity, text color (color inputs)
- Edge rules (list — opens edge-rule editor; rules editing covered by T24)
- Connected surfaces (list — read-only summary; managed by T18)
- Delete surface button

All edits dispatch `updateSurfaceCommand` (single command per change).

## Bottom-panel surfaces tab — `SurfaceList`

Columns: Name, Material, Pattern, Area, Warnings count, Visibility toggle, Lock toggle. Clicking a row selects the surface.

## Implementation steps

1. Build `createSurface.ts`, `validateSurface.ts`, `surfaceGeometry.ts` + tests.
2. Build surface commands + tests (inverse correctness).
3. Build `SurfaceLayer` and replace placeholder in `LayersRoot`.
4. Build `SurfaceTool` and `CreateSurfaceDialog`.
5. Build `SurfaceProperties` and mount in `PropertiesPanel` based on selection kind.
6. Build `SurfaceList` and mount in Bottom Panel "Surfaces" tab.
7. Tests:
   - Convert rectangle → surface produces 4 CCW points, area matches `w*h`.
   - `surfaceArea` of L-shape correct.
   - `validateSurface` flags hole outside outer.
   - Properties panel commits each change as a separate undoable command.

## Decisions

- **Surfaces are a top-level collection** (`project.surfaces`), independent of `project.drawingEntities`. Converting a rectangle does **not** delete the rectangle by default — the user might want it as construction geometry. There is an explicit "consume source" checkbox in the dialog.
- **Names must be unique** across surfaces; the dialog validates and shows an error on collision.
- **Outer boundary always normalized to CCW** at commit time.
- **Holes always normalized to CW** at commit time (so even-odd fill works in renderers and exports).

## Open questions

_(none)_

## Acceptance criteria

- [ ] User can draw a surface boundary and name it; it appears on `surfaces` layer.
- [ ] User can convert a rectangle or polygon into a surface.
- [ ] Surface name, area, dimensions toggleable from properties panel.
- [ ] `surfaceArea` matches plan example (L-shape, rectangle minus rectangle).
- [ ] Surface list in bottom panel reflects current surfaces and selects on click.
- [ ] All surface commands undo/redo correctly.
- [ ] Tests pass.

## Verification

```
npm test -- src/domain/surfaces src/features/surfaces
```

## Progress Log

_(append entries here)_
