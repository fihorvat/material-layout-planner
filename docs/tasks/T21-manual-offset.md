# T21 — Manual offset (numeric + mouse handle)

- **Milestone**: M4
- **Depends on**: T20
- **Status**: todo

## Goal

Implement manual placement-pattern offset adjustment, both as numeric inputs (already in T20) and as a draggable origin handle on the canvas. Provide quick-action buttons (center, align edges, reset, lock).

## Files

```
src/features/placementPatterns/PatternOffsetControls.tsx
src/features/placementPatterns/PatternOriginHandle.tsx
src/features/placementPatterns/useDragPatternOrigin.ts
src/domain/placementPatterns/manualOffset.ts
src/domain/placementPatterns/__tests__/manualOffset.test.ts
```

## Behavior

When a surface with an assigned pattern is selected and `editorStore.activeTool === 'patternOrigin'` (or alternatively when a "Pattern offset" sub-mode is toggled within Select), render a draggable handle at the pattern's effective origin within the surface.

Effective origin computation (`computeEffectivePatternOrigin`):

- Start with `originMode` base point:
  - `surfaceCenter` → surface centroid
  - `topLeft` → surface AABB top-left
  - `bottomLeft` → surface AABB bottom-left
  - `customPoint` → `pattern.customOrigin` (world coords)
- Apply `offsetXmm`, `offsetYmm`.

Dragging the handle:

- During drag, update a *visual-only* delta.
- On `pointerup`, dispatch `updatePlacementPatternCommand` with new `offsetXmm` / `offsetYmm`.
- Snap modes (from plan §18.1): No snap, 1 mm, 5 mm, 10 mm, joint-step, material-unit-step. Selector in `PatternOffsetControls`.
- If `optimizationPriority.manualOffsetLocked === true`, dragging is allowed but optimization in T27 will preserve it.

## Quick-action buttons (plan §18.2)

In `PatternOffsetControls`:

- **Center on surface** → set `originMode = 'surfaceCenter'`, `offsetXmm = 0`, `offsetYmm = 0`.
- **Align to left edge** → set `originMode = 'topLeft'`, `offsetXmm = 0`.
- **Align to right edge** → similar, using surface AABB top-right.
- **Align to top edge** / **Align to bottom edge** likewise.
- **Reset offset** → both offsets to 0, originMode unchanged.
- **Apply to connected surfaces** → for each `SurfaceConnection` of this surface, copy the pattern's `offsetXmm/Y`, `customOrigin`, etc. to the connected surfaces' patterns (only when those surfaces use the same pattern *or* the user confirms). Dispatch a single multi-patch command (sequence them).
- **Lock manual offset** → toggle `optimizationPriority.manualOffsetLocked`.

## `useDragPatternOrigin`

```ts
export const useDragPatternOrigin = (surfaceId: string): {
  origin: Point2D;
  isDragging: boolean;
  onPointerDown: (worldPoint: Point2D) => void;
  onPointerMove: (worldPoint: Point2D) => void;
  onPointerUp: () => void;
};
```

Snaps according to the user-selected snap step within the hook before committing.

## Implementation steps

1. Build `manualOffset.ts` with `computeEffectivePatternOrigin` and snap helpers + tests.
2. Build `PatternOriginHandle` (Konva circle + crosshair).
3. Build `useDragPatternOrigin` with snap behaviors.
4. Build `PatternOffsetControls` and integrate with T20's panel.
5. Wire quick-action buttons to commands.
6. Test:
   - Effective origin for each `originMode` matches expectations.
   - Dragging by (10, 0) mm with no snap updates the pattern offset by (10, 0).
   - 5 mm snap rounds correctly.
   - Joint-step snap rounds to multiples of `jointMm`.
   - Material-unit-step snap rounds to multiples of `unitWidthMm + jointMm` (along x) and `unitHeightMm + jointMm` (along y), respecting orientation.

## Decisions

- **Material-unit step uses unit + joint**, not unit alone. This keeps joints aligned across steps.
- **Drag is single-command**, emitted on pointerup. Live preview is local state.
- **"Apply to connected surfaces"** copies offset fields only, not pattern type or joint width. Document this clearly in the UI tooltip.

## Open questions

_(none)_

## Acceptance criteria

- [ ] Origin handle visible on a selected surface with assigned pattern.
- [ ] Dragging the handle updates `offsetXmm` / `offsetYmm` on pointerup.
- [ ] All snap modes work.
- [ ] Quick-action buttons produce correct results.
- [ ] Lock toggle persists.
- [ ] Apply to connected surfaces propagates correctly.
- [ ] Tests pass.

## Verification

```
npm test -- src/domain/placementPatterns/__tests__/manualOffset.test.ts
```

## Progress Log

_(append entries here)_
