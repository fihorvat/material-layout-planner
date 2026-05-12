# T26 — Validation & warnings system

- **Milestone**: M5
- **Depends on**: T25
- **Status**: todo

## Goal

Continuously validate the project and surface clickable warnings in the bottom-panel "Warnings" tab. Warnings include geometry issues, missing assignments, and piece-level problems from layouts.

## Files

```
src/domain/validation/projectValidator.ts
src/domain/validation/warnings.ts              (warning codes + messages)
src/domain/validation/__tests__/projectValidator.test.ts
src/features/editor/WarningsPanel.tsx          (bottom-panel content)
src/features/editor/useProjectWarnings.ts
src/domain/materialLayout/piecesWarnings.ts    (per-piece warning generator)
```

## Warning model

```ts
export type WarningSeverity = 'info' | 'warning' | 'error';

export type Warning = {
  id: string;            // deterministic from inputs so dedupe is easy
  code: string;          // e.g., 'surface.selfIntersecting'
  severity: WarningSeverity;
  message: string;       // localized human text
  target?:
    | { kind: 'surface'; id: string }
    | { kind: 'opening'; surfaceId: string; holeId: string }
    | { kind: 'piece'; layoutId: string; pieceId: string }
    | { kind: 'connection'; id: string }
    | { kind: 'material'; id: string }
    | { kind: 'pattern'; id: string };
};
```

## Warning codes (initial set)

| Code | Severity | Trigger |
|---|---|---|
| `surface.notClosed` | error | Polygon validation flags. |
| `surface.selfIntersecting` | error | T15 validation. |
| `surface.holeOutside` | error | Hole not inside outer. |
| `surface.holesOverlap` | error | Two holes intersect. |
| `surface.missingMaterial` | warning | Surface has no `materialId`. |
| `surface.missingPattern` | warning | Surface has no `placementPatternId`. |
| `material.thicknessMissing` | warning | `thicknessMm <= 0`. |
| `material.invalidJoint` | warning | `defaultJointMm < 0`. |
| `edge.overlapNoEdge` | warning | Overlap configured but no edge selected. |
| `edge.overlapExceedsMax` | warning | `maxOverlapMm > unit dim / 2` (heuristic). |
| `piece.belowMinWidth` | warning | `boundingWidthMm < material.minPieceWidthMm`. |
| `piece.belowMinHeight` | warning | `boundingHeightMm < material.minPieceHeightMm`. |
| `piece.tooThin` | warning | min dim < 10 mm. |
| `piece.irregular` | info | `isIrregular === true`. |
| `connection.edgeLengthMismatch` | info | `Δlength > 1 mm`. |
| `pattern.manualLockedNoOptimize` | info | User locked manual offset; optimization skipped (set during T27). |
| `surfaces.overlap` | warning | Two surfaces' polygons intersect. |

Add more codes in `warnings.ts` and reference them by constant in code.

## `projectValidator.ts`

```ts
export const validateProject = (project: Project): Warning[];
```

Aggregates:

- Per-surface geometry validation (calls `validateSurface`).
- Cross-surface checks (overlap detection via polygon intersection).
- Material checks.
- Per-edge-rule sanity checks.
- Per-connection edge-length mismatch.
- For each `MaterialLayout` in `project.materialLayouts`, run `piecesWarnings(layout, material)`.

`piecesWarnings(layout, material)` returns piece-level warnings and also writes `warnings` array onto each piece for selection-based display.

## UI — `WarningsPanel`

Bottom-panel "Warnings" tab. Group warnings by severity. Each row:

- Icon by severity
- Code, message
- Target chip → clicking selects the target and pans/zooms to it (`editorStore.viewport`).

Filter pills at top: All / Errors / Warnings / Info.

Toolbar shows a small badge with error count (red), warning count (yellow); badge total is the sum.

## `useProjectWarnings`

Hook that memoizes the warning list against the project + materialLayouts and exposes:

```ts
{ warnings: Warning[]; errorCount: number; warningCount: number; infoCount: number }
```

## Implementation steps

1. Build `warnings.ts` constants and message templates.
2. Build `projectValidator.ts` with comprehensive tests.
3. Build `piecesWarnings.ts`.
4. Build `WarningsPanel` and badge in toolbar.
5. Wire click → target navigation (a small helper `focusTarget(target)` that selects + adjusts viewport).

## Decisions

- **Warnings are computed, not stored** (except piece-level which are persisted on the piece for PDF). This keeps the project file lean.
- **Severity levels follow standard convention** so badges and styles are consistent.
- **Surface-overlap check is O(n²)**; acceptable for MVP (n ≤ 50).

## Open questions

_(none)_

## Acceptance criteria

- [ ] All listed warning codes are produced when their condition holds.
- [ ] Bottom-panel "Warnings" tab shows the list with severity grouping.
- [ ] Clicking a warning selects its target.
- [ ] Toolbar badge counts errors/warnings.
- [ ] Tests cover at least 10 warning codes including positive and negative cases.

## Verification

```
npm test -- src/domain/validation
```

## Progress Log

_(append entries here)_
