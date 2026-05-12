# T20 — Placement patterns (model & panel)

- **Milestone**: M4
- **Depends on**: T19
- **Status**: todo

## Goal

Provide placement-pattern definitions and a UI panel to edit them. Patterns are referenced by surfaces (`Surface.placementPatternId`). Multiple surfaces may share one pattern by reference, or have their own.

## Pattern types (MVP scope — plan §17)

Implemented now:

- `stacked` — horizontal stacked (no offset row to row)
- `verticalStacked` — vertical stacked
- `runningBondHalf` — 50% row offset
- `runningBondThird` — 33% row offset
- `customOffset` — user-specified `rowOffsetMm` or `rowOffsetPercent`
- `diagonal` — `customAngle` rotation; rows stack along the rotated axis

Out of scope for MVP (model fields exist, panel disables them):

- `herringbone`, `multiSizeModular`, `random`

## Files

```
src/features/placementPatterns/PlacementPatternPanel.tsx       (right-panel content)
src/features/placementPatterns/PatternListBottomTab.tsx        (optional bottom view of all patterns)
src/features/placementPatterns/OptimizationPanel.tsx           (priority sliders; full wiring in T27)
src/features/placementPatterns/AssignPatternControl.tsx
src/domain/placementPatterns/placementPattern.ts               (factory + helpers)
src/domain/placementPatterns/__tests__/placementPattern.test.ts
src/domain/commands/builtin/placementPatternCommands.ts
```

## `placementPattern.ts`

```ts
export const createPlacementPattern = (input: Partial<PlacementPattern> & { name: string }): PlacementPattern;
export const rowOffsetForType = (type: PlacementPattern['type'], unitWidthMm: number): number;
// running bond half/third return unitWidth * 0.5 or unitWidth / 3, etc.
export const isManualOffsetLocked = (p: PlacementPattern): boolean;
```

Defaults:

```ts
{
  type: 'stacked',
  orientation: 'horizontal',
  angleDeg: 0,
  jointMm: 3,
  offsetXmm: 0,
  offsetYmm: 0,
  rowOffsetMm: 0,
  rowOffsetPercent: 0,
  originMode: 'surfaceCenter',
  direction: 'leftToRight',
  symmetryMode: 'none',
  optimizationPriority: defaultOptimizationPriority(),
}
```

## Commands

```ts
addPlacementPatternCommand({ pattern: PlacementPattern });
updatePlacementPatternCommand({ id, patch: Partial<PlacementPattern> });
deletePlacementPatternCommand({ id });   // blocks if used; same approach as T19
assignPlacementPatternCommand({ surfaceId, patternId: string | null });
```

## `PlacementPatternPanel`

Fields (plan §40.4):

- Pattern name
- Pattern type (select with disabled future types showing "(post-MVP)")
- Orientation (horizontal / vertical / customAngle)
- Angle (length input as degrees; only enabled if orientation === customAngle)
- Joint / gap (length input)
- Offset X (length input)
- Offset Y (length input)
- Row offset (length input — mm)
- Row offset percent (number input — 0..100; sync with mm via material unit width if known)
- Origin mode (select: surfaceCenter / topLeft / bottomLeft / customPoint)
- Custom origin X, Y (only when originMode === customPoint)
- Direction (select)
- Symmetry mode (select)
- "Lock manual offset" toggle (controls `optimizationPriority.manualOffsetLocked`)
- Optimization sub-panel (`OptimizationPanel`) — sliders for Low/Medium/High mapped to numeric weights (1 / 2 / 4); see plan §19.

Each field change dispatches an `updatePlacementPatternCommand` with the relevant patch.

## Surface assignment

`AssignPatternControl` is rendered inside `SurfaceProperties`. Selecting a pattern dispatches `assignPlacementPatternCommand`. "Create new…" opens an inline editor that produces a new pattern and assigns it.

## Implementation steps

1. Build pattern helpers + tests (row offsets for type, default factories).
2. Build commands + tests (delete-while-used blocked; assign/unassign).
3. Build the right-panel editor; mount when a pattern or a surface with an assigned pattern is selected.
4. Build assign control inside surface properties.
5. The actual pattern application to the surface (computing the grid) is T22; this task ends with edit-and-store only.

## Decisions

- **Patterns are shareable across surfaces by reference**. Editing a pattern updates all assigned surfaces (and triggers re-layout in T22+).
- **Row offset uses mm internally**; the percent field is a convenience computed against the assigned material's `unitWidthMm`. If no material is assigned, the percent field is disabled.
- **Optimization weights mapped from priority labels**: Low → 1, Medium → 2, High → 4. Joint alignment off → 0; "Selected surfaces" → 1; "Connected group" → 2.

## Open questions

_(none)_

## Acceptance criteria

- [ ] User can create, edit, delete placement patterns.
- [ ] Surface can be assigned to a pattern.
- [ ] All editor fields update the pattern correctly.
- [ ] Optimization sub-panel writes to `optimizationPriority` correctly.
- [ ] Deleting an in-use pattern blocked with reason.
- [ ] Tests pass.

## Verification

```
npm test -- src/domain/placementPatterns src/features/placementPatterns
```

## Progress Log

_(append entries here)_
