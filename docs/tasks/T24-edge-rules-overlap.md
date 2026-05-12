# T24 — Edge rules & physical overlap

- **Milestone**: M5
- **Depends on**: T23, T18
- **Status**: todo

## Goal

Implement edge-rule resolution and physical-overlap-aware working-zone expansion. The output is the `physicalWorkingPolygon` that T23's `buildMaterialLayout` consumes.

## Files

```
src/domain/surfaces/edgeRules.ts
src/domain/surfaces/__tests__/edgeRules.test.ts
src/domain/materialLayout/computeWorkingPolygon.ts
src/domain/materialLayout/__tests__/computeWorkingPolygon.test.ts
src/features/surfaces/EdgeRulesPanel.tsx
src/domain/commands/builtin/edgeRuleCommands.ts
```

## `edgeRules.ts`

Pure helpers:

```ts
export const getEffectiveEdgeRule = (
  surface: Surface,
  edgeIndex: number,
  connections: SurfaceConnection[]
): ResolvedEdgeRule;

type ResolvedEdgeRule = {
  edgeIndex: number;
  ruleType: 'hardStop' | 'softBoundary' | 'physicalOverlap' | 'connectedOverlap';
  maxOverlapMm: number;
  overlapOpacity: number;
  applyThicknessCompensation: boolean;
  customThicknessAllowanceMm?: number;
  source: 'connection' | 'edgeRule' | 'default';
};
```

Resolution order:

1. If a connection covers this edge and has `allowPhysicalOverlap === true`, return a `connectedOverlap` rule using the connection's `defaultOverlapMm` / `overlapOpacity`.
2. Else, if the surface has an explicit `EdgeRule` for this edge index, return it.
3. Else, return the default: `hardStop`, `maxOverlapMm = 0`, `overlapOpacity = 0.25`.

## `computeWorkingPolygon`

```ts
export const computeWorkingPolygon = (input: {
  surface: Surface;
  connections: SurfaceConnection[];
}): { visible: Polygon; physical: Polygon };
```

Algorithm:

1. Build `visible` from `surface.outerBoundary` + `surface.holes`.
2. For each edge `i`:
   - Resolve effective rule.
   - If `ruleType === 'hardStop' || 'softBoundary'` → no expansion on this edge.
   - Else (`physicalOverlap` or `connectedOverlap`) → expand the edge outward by `maxOverlapMm` perpendicular to the edge (away from surface interior). The expansion is a *local* polygon piece that gets unioned with the surface.
3. `physical = polygonUnion(visible, expansionPolygons...)`.

Edge outward direction:

- Surface outer boundary is CCW; the outward normal of edge `(a → b)` is `rotate(b - a, -90°) / |b - a|` (since y is down, rotating by -90° gives a vector pointing to the *left* of the walk direction, which is outside for CCW outer). **Verify** with a unit test on a CCW square.

Expansion geometry:

- Build a small quad `[a, b, b + n*overlap, a + n*overlap]` for each overlapping edge.
- Union all such quads with the visible polygon.

## Commands

```ts
addEdgeRuleCommand({ surfaceId, rule: EdgeRule });
updateEdgeRuleCommand({ surfaceId, edgeIndex, patch: Partial<EdgeRule> });
removeEdgeRuleCommand({ surfaceId, edgeIndex });
```

Each command updates `surface.edgeRules` (a list of rules keyed by `edgeIndex`).

## `EdgeRulesPanel`

UI within the Surface properties panel: list of edges with their resolved rule. Each row:

- Edge label: `Edge 1 (1200 mm)` etc.
- Rule type dropdown.
- Max overlap mm (when overlap rule).
- Overlap opacity slider.
- Connected edge picker (when `connectedOverlap`).
- Thickness compensation toggle.
- Custom allowance mm.

The panel renders the resolved source (connection / edge rule / default) as a small badge to explain precedence.

## Hooking into the layout build

Update T23's `buildMaterialLayout` (or its caller, T25) to call `computeWorkingPolygon` first, then pass `physical` and `visible` polygons to `buildMaterialLayout`.

## Implementation steps

1. Build `edgeRules.ts` + tests for precedence.
2. Build `computeWorkingPolygon` + tests:
   - CCW square with `physicalOverlap = 10` on the right edge → physical polygon is the square plus a 10 mm strip on the right.
   - Two adjacent overlapping edges → expansions overlap properly via union.
3. Build commands.
4. Build `EdgeRulesPanel` integrated into `SurfaceProperties`.
5. Update layout assembly callsite (T25).

## Decisions

- **Outer boundary normalized to CCW** at surface creation/commit (T15 already enforces this). This makes outward-normal direction unambiguous.
- **Connection overrides edge rule** — explicit precedence rule per plan §13.
- **Default overlap opacity** comes from `project.settings.defaultOverlapOpacity` when a new edge rule is created. Stored value on the rule is used at render time.

## Open questions

_(none)_

## Acceptance criteria

- [ ] Hard stop edges produce physical zone equal to visible.
- [ ] Overlap edges expand the physical zone outward by the configured amount.
- [ ] Connected edges with overlap allowed produce `connectedOverlap` source.
- [ ] Edge rules panel correctly displays and edits rules.
- [ ] Commands undo/redo correctly.
- [ ] Tests pass.

## Verification

```
npm test -- src/domain/surfaces/__tests__/edgeRules.test.ts \
            src/domain/materialLayout/__tests__/computeWorkingPolygon.test.ts
```

## Progress Log

_(append entries here)_
