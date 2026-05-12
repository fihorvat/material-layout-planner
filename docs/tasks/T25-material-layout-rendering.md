# T25 — Material layout rendering

- **Milestone**: M5
- **Depends on**: T23, T24
- **Status**: todo

## Goal

Wire layout generation into the editor, render `MaterialLayout` on the canvas with the visible/overlap visual rules from plan §21, and surface layout management commands and properties.

## Files

```
src/features/materialLayout/MaterialLayoutLayer.tsx        (fills the materialLayout placeholder layer)
src/features/materialLayout/OverlapLayer.tsx               (separate Konva layer above material)
src/features/materialLayout/MaterialPieceShape.tsx
src/features/materialLayout/MaterialPieceLabel.tsx
src/features/materialLayout/PatternOriginMarker.tsx
src/features/materialLayout/useGenerateLayout.ts
src/domain/materialLayout/optimizeMaterialLayout.ts        (stub here; full optimizer in T27)
src/domain/materialLayout/generateLayoutsForProject.ts
src/domain/commands/builtin/materialLayoutCommands.ts
src/domain/materialLayout/__tests__/generateLayoutsForProject.test.ts
```

## Generation flow

`generateLayoutsForProject(project)`:

For each `Surface` with `materialId` and `placementPatternId`:

1. Look up `material` and `pattern`.
2. Compute `visible` and `physical` polygons via `computeWorkingPolygon` (T24).
3. Call `buildMaterialLayout` (T23) → `MaterialLayout`.
4. Return list of `MaterialLayout`s.

T27 will wrap this with optimization. For now (T25), a stub `optimizeMaterialLayout` just calls `buildMaterialLayout` with the user's pattern as-is and returns the single result. The stub interface must already match what T27 will implement.

`useGenerateLayout`:

- Subscribes to relevant slices of `projectStore` (surfaces, materials, patterns, edgeRules, connections).
- Debounces 150 ms; on change, runs `generateLayoutsForProject` and stores results in a *layouts cache* hook (memoized; not persisted as it's recomputable). Also dispatches `setMaterialLayoutsCommand` if caller opts in to persistence (default: cache only, persist only on user "Generate" action).

## Commands

```ts
setMaterialLayoutsCommand({ layouts: MaterialLayout[] });       // replaces project.materialLayouts wholesale; inverse restores previous
clearMaterialLayoutsCommand({});
```

Layouts are persisted so PDF export (T31+) can read them directly. Cache exists for live preview; user "Generate" or any meaningful layout-changing edit persists.

## Rendering — `MaterialLayoutLayer`

For each `MaterialLayout`:

- For each `MaterialPiece`:
  - Visible polygon: `<Line points fill={material.style.fillColor} closed strokeColor opacity={1} />` with a thin joint-colored stroke.
  - Joint gap between pieces is *not* drawn explicitly — the gap is implicit by the piece polygons not touching.
  - If a piece is irregular, draw an inner subtle hatched fill (use Konva `Pattern` or skip in MVP; document as nicety).
- For the overlap layer:
  - Each `overlapPolygons` polygon rendered with same fill but `opacity = effectiveOpacity` (from edge rule that produced the overlap; default 0.25), stroke dashed.

Show `MaterialPieceLabel` near each piece's `labelPosition` when:

- The bottom panel "Layouts" tab toggles "Show piece IDs" (per-layout setting).
- Or zoom > 0.4.

Label contents: `pieceCode` plus optional size (`600 × 300 × 20 mm`) when the piece is large enough on screen.

`PatternOriginMarker` (small crosshair + label) renders at `computeEffectivePatternOrigin`.

## Rendering performance

- Use one Konva `Shape` per piece OR a single batched `Path` per layout with manual draw fn. For MVP, per-piece `Line` is acceptable up to a few thousand pieces.
- Set `listening={false}` for pieces unless the Select tool needs them (it does — keep listening on but enable `perfectDrawEnabled={false}` and `shadowForStrokeEnabled={false}`).

## Implementation steps

1. Build `generateLayoutsForProject` + tests.
2. Build the `useGenerateLayout` hook with caching.
3. Build `MaterialLayoutLayer`, `MaterialPieceShape`, `MaterialPieceLabel`, `OverlapLayer`, `PatternOriginMarker`.
4. Replace placeholders in `LayersRoot` from T06.
5. Wire toolbar "Generate layout" button (rebuilds + dispatches `setMaterialLayoutsCommand`).

## Decisions

- **Layouts persisted with the project** so PDFs and cut lists are stable across sessions. Re-generating overwrites them.
- **Cache during editing** to avoid spamming the undo stack with auto-generated layouts.
- **Pieces are selectable** — clicking a piece shows piece properties (plan §40.5) in the right panel.
- **Overlap rendered on a higher layer** so it draws above the visible material from neighboring surfaces, ensuring the semi-transparent look the user expects.

## Open questions

_(none)_

## Acceptance criteria

- [ ] Assigning a material + pattern to a surface produces material pieces on the canvas.
- [ ] Editing the joint width, pattern offset, or material size live-updates the layout (cache).
- [ ] Clicking "Generate layout" persists layouts to the project.
- [ ] Overlap polygons render semi-transparently.
- [ ] Piece labels visible when zoomed in.
- [ ] Selecting a piece shows its properties.
- [ ] Tests pass.

## Verification

```
npm test -- src/domain/materialLayout
npm run dev   # manual: full flow from surface → material → pattern → pieces visible
```

## Progress Log

_(append entries here)_
