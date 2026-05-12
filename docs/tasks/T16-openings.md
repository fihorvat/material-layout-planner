# T16 — Openings

- **Milestone**: M3
- **Depends on**: T15
- **Status**: todo

## Goal

Provide an Opening tool that punches holes into surfaces. Openings are stored as entries in the parent surface's `holes` array; an auxiliary `Opening` UI record holds metadata (name, style, dimension flags) keyed by `(surfaceId, holeIndex)`.

## Data model addition (extends T02)

In `types/surface.ts`, add:

```ts
type SurfaceHoleMeta = {
  id: string;             // stable ID separate from index
  name?: string;
  showDimensions: boolean;
  style: DrawingStyle;
};
type Surface = { /* existing fields */ holeMeta: SurfaceHoleMeta[] };
```

`holeMeta[i]` corresponds to `holes[i]`. Surface commands keep them in sync.

## Files

```
src/features/drawingTools/OpeningTool.tsx
src/features/drawingTools/opening/useOpeningDraw.ts
src/features/drawingTools/opening/OpeningPreview.tsx
src/features/surfaces/OpeningRenderer.tsx           (renders openings inside SurfaceLayer)
src/features/surfaces/OpeningProperties.tsx
src/domain/surfaces/openingValidation.ts
src/domain/commands/builtin/openingCommands.ts
src/features/drawingTools/opening/__tests__/*.test.ts
```

## Tool flow

1. Activate Opening tool. The Properties Panel offers a sub-toolbar: Rectangle / Polygon / From selection.
2. Rectangle mode: same as Rectangle tool but commits as an opening on the surface under the first click.
3. Polygon mode: same as Polygon tool, commits as an opening.
4. From selection: if a rectangle or polygon entity is selected, convert it.
5. Determine parent surface by point-in-polygon test against all surfaces; choose the smallest (innermost) match. If no surface matches the first click point, show a warning and abort.

## Validation — `openingValidation.ts`

Pre-commit checks:

- Opening polygon must be valid (use T07 `validatePolygon`).
- Opening must be entirely inside the parent surface's outer boundary.
- Opening must not intersect existing holes of the same surface.

Failures → show modal with error, no commit.

## Commands

```ts
addOpeningCommand({ surfaceId, hole: Point2D[], meta: Omit<SurfaceHoleMeta, 'id'> });
removeOpeningCommand({ surfaceId, holeId });
updateOpeningCommand({ surfaceId, holeId, patch: { hole?, meta? } });
```

Inverses re-insert at the original index and restore previous values.

## Rendering

`OpeningRenderer` is invoked from `SurfaceLayer`. For each hole:

- Konva subpath rendered already by the parent surface fill (even-odd).
- Draw the outline using opening's style.
- Optional name label at centroid.
- Optional dimensions on each edge (controlled by `meta.showDimensions`).

## Properties panel

`OpeningProperties` shows:

- Name, Show dimensions
- Line color, line thickness
- Parent surface (read-only label)
- Delete opening button

## Implementation steps

1. Extend `SurfaceSchema` in T02 with `holeMeta`. Update `createEmptyProject` so new surfaces start with `holeMeta: []`. Add a migration step in `storage/migrations.ts` if a `schemaVersion` bump is needed; otherwise add `holeMeta` as `.default([])` in Zod to keep backward compat for v1.
2. Build opening validation and tests.
3. Build commands and tests.
4. Build `OpeningTool` and renderer.
5. Build `OpeningProperties` and integrate into properties panel via selection store.

## Decisions

- **Openings are not separate entities** in the project model — they are holes in surfaces. This avoids divergence between visual openings and the geometry the layout engine sees. Metadata is colocated via `holeMeta`.
- **Parent surface auto-detected on creation**; user can move openings between surfaces via Select tool drag (an opening dragged out of its surface is rejected with a snap-back animation).
- **Opening orientation normalized to CW** at commit (matches T15 hole convention).

## Open questions

_(none)_

## Acceptance criteria

- [ ] Drawing a rectangle opening on a surface produces a hole; surface fill shows through.
- [ ] Drawing an opening outside any surface is rejected with a clear message.
- [ ] Polygon openings supported.
- [ ] Opening invalid → blocked with reason.
- [ ] Opening commands undo/redo correctly.
- [ ] Opening properties editable.
- [ ] Tests pass.

## Verification

```
npm test -- src/features/drawingTools/opening src/domain/surfaces
```

## Progress Log

_(append entries here)_
