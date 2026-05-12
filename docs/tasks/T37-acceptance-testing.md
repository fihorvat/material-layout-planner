# T37 — Acceptance testing & bug-fix pass

- **Milestone**: M10
- **Depends on**: every earlier task
- **Status**: todo

## Goal

Verify each item in `docs/plan.md` §51 (Acceptance Criteria) and run the full testing plan in §52. Fix any bugs found. Produce a short release report.

## Files

```
docs/tasks/T37-release-report.md          (written at the end with results + known issues)
src/test/integration/*.test.ts             (workflow tests below)
```

## Workflows to exercise (manual + integration tests where feasible)

For each: write a test in `src/test/integration/` that runs the workflow against the store, repository, and pure domain functions. UI exercising is manual.

1. **Create project from scratch** — produce a project, draw a rectangle, convert to surface, assign material, assign pattern, generate layout, export PDF. Assert the PDF is non-empty and the cut list lists expected pieces.
2. **Create project from background image** — import image, calibrate, draw measured geometry on top. Assert calibrated distance is honored.
3. **Multiple connected surfaces** — create 2 surfaces, connect their edges, set physical overlap. Assert overlap polygons exist for pieces straddling the edge.
4. **Surface splitting** — split a surface, assign different materials to each part, regenerate layouts. Assert two layouts present.
5. **Manual pattern offset** — drag origin handle, lock manual offset, run optimization. Assert offset preserved.
6. **JSON round-trip** — export, delete project, import. Assert equality.
7. **Save and reload** — refresh the page, project still loads. Assert no warnings about data loss.
8. **Warnings** — create surface that self-intersects; assert warnings panel reports the issue and clicking it selects the surface.

## Acceptance criteria from plan §51 (full checklist)

Run through each bullet of plan.md §51 and tick:

- [ ] User can create a local project.
- [ ] User can draw accurate measured 2D geometry.
- [ ] User can draw lines by exact length and angle.
- [ ] User can draw rectangles by exact width and height.
- [ ] User can draw polygons with dimensioned edges.
- [ ] User can create openings inside surfaces.
- [ ] User can create named surfaces.
- [ ] User can split a surface into multiple surfaces.
- [ ] User can connect multiple 2D surfaces.
- [ ] User can assign one material to each surface.
- [ ] Material supports unit width, unit height, and thickness.
- [ ] User can define joint/gap width.
- [ ] User can define physical material overlap on selected edges.
- [ ] Overlap is displayed semi-transparently.
- [ ] User can choose placement pattern and orientation.
- [ ] User can manually adjust horizontal and vertical offset by mouse.
- [ ] User can manually enter horizontal and vertical offset values.
- [ ] User can choose optimization priorities.
- [ ] Every material piece can show its ID and size.
- [ ] Cut pieces show physical size including overlap.
- [ ] Material cut list includes thickness.
- [ ] PDF includes final appearance.
- [ ] PDF includes technical drawing with dimensions.
- [ ] PDF includes material layout.
- [ ] PDF includes material cut list.
- [ ] PDF includes cutting diagrams or grouped cutting instructions.
- [ ] PDF includes installation instructions.
- [ ] Project saves locally in the browser.
- [ ] Project can be exported and imported as JSON.
- [ ] Background image can be imported, calibrated, locked, and traced over.
- [ ] Warnings are shown for invalid geometry and problematic pieces.
- [ ] Undo/redo works for core editing actions.

## Testing plan from §52

- **Unit tests**: every domain module already covered by earlier tasks. Re-run `npm test` and confirm coverage isn't surprisingly low (`vitest --coverage`).
- **Integration tests**: the workflows above.
- **Visual tests**: dimensions, overlap opacity, labels, selections, calibration. Manual screenshots checked into `docs/tasks/visual-evidence/` (PNG, named by workflow).
- **Edge cases**:
  - Tiny surface (10 × 10 mm).
  - Large surface (10 m × 10 m).
  - 0 mm joint.
  - 0 mm overlap.
  - Maximum overlap (50% of unit dim).
  - Self-intersecting polygon attempt.
  - Opening outside surface attempt.
  - Connected edges of different lengths.
  - Material thicker than overlap.
  - Manual offset dragged outside surface bounds.

## Bug-fix protocol

For each failing acceptance criterion or test:

1. Add a regression test that reproduces the failure first.
2. Fix the root cause; avoid downstream workarounds (per repo discipline).
3. Re-run the full test suite.
4. Note the fix in this task's Progress Log with the regression test path.

## Release report — `T37-release-report.md`

Sections:

- Date and commit hash.
- Test suite results (counts and coverage).
- Acceptance checklist (tick state).
- Known issues (with severity).
- Performance numbers (FPS at N pieces, PDF export time for fixture).
- Open follow-ups for Phase 2.

## Implementation steps

1. Write integration tests for the eight workflows.
2. Run the full plan §51 checklist manually.
3. Run plan §52 edge-case checks.
4. Fix discovered bugs.
5. Produce release report.

## Decisions

- **Coverage target**: ≥ 70 % statements on `src/domain/**`; UI not gated on coverage.
- **Performance budgets**: per `conventions.md` §11; verify with profiling.

## Open questions

_(none)_

## Acceptance criteria

- [ ] All plan §51 bullets ticked.
- [ ] All workflow integration tests pass.
- [ ] Edge-case tests pass.
- [ ] Coverage target met.
- [ ] Release report present in this folder.

## Verification

```
npm run lint
npm run typecheck
npm test -- --coverage
npm run build
```

## Progress Log

_(append entries here)_
