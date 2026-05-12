# T18 — Surface connections

- **Milestone**: M3
- **Depends on**: T15
- **Status**: todo

## Goal

Connect two surfaces via shared edges with a defined connection type (outside corner, inside corner, flat continuation, butt joint, custom). Connections feed the layout engine for joint continuity, the edge rules for overlap behavior, and the PDF for installation notes.

## Files

```
src/features/drawingTools/ConnectionTool.tsx
src/features/surfaces/SurfaceConnectionDialog.tsx
src/features/surfaces/ConnectionList.tsx
src/features/surfaces/ConnectionVisualizer.tsx       (visual badge on connected edges)
src/domain/surfaces/connectSurfaces.ts
src/domain/surfaces/connectionValidation.ts
src/domain/surfaces/__tests__/connectSurfaces.test.ts
src/domain/commands/builtin/connectionCommands.ts
```

## Connection model (recap from T02)

`SurfaceConnection`: `{ id, surfaceAId, edgeAId, surfaceBId, edgeBId, connectionType, angleDeg, jointAtConnectionMm, allowPatternContinuation, allowPhysicalOverlap, defaultOverlapMm, overlapOpacity, thicknessMode }`.

`edgeAId` / `edgeBId` are strings; we encode as `"${surfaceId}#${edgeIndex}"`. Convert helpers:

```ts
export const encodeEdgeId = (surfaceId: string, edgeIndex: number): string;
export const decodeEdgeId = (edgeId: string): { surfaceId: string; edgeIndex: number };
```

Each `Surface` keeps `connections: SurfaceConnectionRef[]` with the `connectionId` only.

## Tool flow

1. Activate Connection tool.
2. Click an edge of Surface A. Edge highlights and a tooltip shows "Select edge of second surface".
3. Click an edge of a different surface B. If the surfaces are the same, show error and abort.
4. `SurfaceConnectionDialog` opens with:
   - Connection type select (5 options).
   - Angle input (default `90` for corners, `180` for flat continuation).
   - `Joint at connection` mm (default = the joint width of either material, fallback `3`).
   - Allow pattern continuation toggle.
   - Allow physical overlap toggle (default off).
   - Default overlap mm (only when overlap allowed).
   - Overlap opacity slider (0..1, default `0.25`).
   - Thickness mode select: `ignoreThickness`, `showThicknessOnly`, `compensateCoveredEdge`, `customAllowance`.
   - Custom thickness allowance mm (only when `customAllowance`).
5. On confirm, dispatch `addConnectionCommand`.

## Commands

```ts
addConnectionCommand({ connection: SurfaceConnection });
updateConnectionCommand({ id, patch: Partial<SurfaceConnection> });
deleteConnectionCommand({ id });
```

Each command also updates the corresponding surfaces' `connections` arrays (push/remove the ref).

## Validation

`connectionValidation.ts`:

- Both surfaces must exist.
- Edge indices must be in range of each surface's `outerBoundary`.
- The two surfaces must not already have a connection between the same two edges (only one connection per (edge, edge) pair).
- Warn (not block) if edge lengths differ by more than 1 mm (will produce trimmed material on the longer edge).

## Visualization

`ConnectionVisualizer` draws on each connected edge:

- A small chevron mid-edge with color by `connectionType`.
- Tooltip on hover: type, angle, overlap settings.
- Clicking the chevron selects the connection and opens it in the properties panel.

## Bottom-panel content

Add a sub-section under the Surfaces tab listing all connections grouped by surface, with edit/delete buttons.

## Implementation steps

1. Build edge-id encode/decode + helpers in `surfaceGeometry.ts`.
2. Build `connectSurfaces.ts` and validation tests.
3. Build commands with inverses.
4. Build the dialog, tool, and visualizer.
5. Integrate properties panel: when a connection is selected, show its fields.

## Decisions

- **Pattern continuation is metadata only in MVP**: the layout engine in T22+T27 reads the flag but the first version may still treat each surface independently with shared origin (see plan §24). Document the limitation.
- **Overlap settings on the connection** override any per-edge rule when both are set; the resolution is "connection wins, then edge rule, then no overlap". Edge rules referencing connections must store the `connectionId` (see T24).
- **Angle is informational** in MVP; used for PDF notes and corner-thickness compensation hints.

## Open questions

_(none)_

## Acceptance criteria

- [ ] User can connect two surfaces by picking edges and choosing a type.
- [ ] Connection appears in both surfaces' `connections` arrays.
- [ ] Editing a connection updates both surfaces consistently.
- [ ] Deleting a connection cleans up both refs.
- [ ] Validation rejects same-surface connections and out-of-range edges.
- [ ] Connections render as chevrons on the connected edges.
- [ ] Tests pass.

## Verification

```
npm test -- src/domain/surfaces/__tests__/connectSurfaces.test.ts
```

## Progress Log

_(append entries here)_
