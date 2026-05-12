# Task Index — 2D Material Layout Planner

This is the master index for all implementation tasks. Each task is a self-contained work unit with detailed instructions, decisions, acceptance criteria, and a progress log. Agents executing a task **must** update the **Progress Log** section of that task file as they work, and update the **Status** column in this index when starting or completing.

> Read `conventions.md` before starting any task. It defines folder layout, naming, code style, testing rules, and shared decisions referenced by every task.

## Status legend

- `todo` — not started
- `in_progress` — an agent is actively working on it
- `blocked` — waiting on a dependency or open question
- `review` — implementation complete, pending verification
- `done` — implementation merged and acceptance criteria met

## How an agent picks up work

1. Open this `README.md`.
2. Find the lowest-numbered task whose status is `todo` and whose dependencies are all `done`.
3. Read `conventions.md` end-to-end.
4. Read the task file end-to-end before writing any code.
5. Set the task's `Status` field to `in_progress` and update the row below.
6. Implement, write tests, update the **Progress Log** at the bottom of the task file as you go (one entry per session minimum).
7. When finished, set `Status: review`, fill **Verification** section, and update this index.

## Index

| ID | Title | Milestone | Depends on | Status |
|---|---|---|---|---|
| T01 | Project bootstrap & tooling | M1 | — | review |
| T02 | Type system & domain models | M1 | T01 | review |
| T03 | State management (Zustand stores) | M1 | T02 | review |
| T04 | Local persistence (IndexedDB + JSON) | M1 | T02, T03 | review |
| T05 | Editor shell layout | M1 | T03 | review |
| T06 | Canvas stage (Konva, grid, pan/zoom) | M1 | T05 | review |
| T07 | Geometry utilities & unit parser | M2 | T02 | review |
| T08 | Command pattern & undo/redo | M2 | T03 | review |
| T09 | Select tool | M2 | T06, T08 | review |
| T10 | Line tool | M2 | T07, T08, T09 | review |
| T11 | Rectangle tool | M2 | T07, T08, T09 | review |
| T12 | Polygon tool | M2 | T07, T08, T09 | review |
| T13 | Dimension tool & rendering | M2 | T07, T10 | review |
| T14 | Label tool | M2 | T09 | review |
| T15 | Surfaces (create, render, validate) | M3 | T11, T12, T13 | review |
| T16 | Openings | M3 | T15 | review |
| T17 | Surface splitting | M3 | T15 | review |
| T18 | Surface connections | M3 | T15 | review |
| T19 | Materials (model, editor, list) | M4 | T15 | review |
| T20 | Placement patterns (model & panel) | M4 | T19 | review |
| T21 | Manual offset (numeric + mouse) | M4 | T20 | review |
| T22 | Material grid generation | M5 | T20 | review |
| T23 | Piece clipping (physical + visible) | M5 | T07, T22 | review |
| T24 | Edge rules & physical overlap | M5 | T23, T18 | review |
| T25 | Material layout rendering | M5 | T23, T24 | review |
| T26 | Validation & warnings system | M5 | T25 | review |
| T27 | Optimization engine (worker) | M6 | T25, T26 | review |
| T28 | Cut list & grouping | M7 | T25 | review |
| T29 | Cutting diagrams | M7 | T28 | review |
| T30 | Waste calculation & layout stats | M7 | T25 | review |
| T31 | PDF infrastructure & summary/instructions pages | M8 | T28, T30 | todo |
| T32 | PDF technical drawing & material layout pages | M8 | T31, T25 | todo |
| T33 | PDF cut list & cutting diagram pages | M8 | T31, T28, T29 | todo |
| T34 | Background image import & calibration | M9 | T06 | todo |
| T35 | Project dashboard & JSON import/export | M10 | T04 | todo |
| T36 | Keyboard shortcuts & polish | M10 | T09, T35 | todo |
| T37 | Acceptance testing & bug-fix pass | M10 | all above | todo |

## Milestone mapping

- **M1** Project Shell And Canvas — T01–T06
- **M2** Drawing Tools — T07–T14
- **M3** Surfaces And Openings — T15–T18
- **M4** Materials And Patterns — T19–T21
- **M5** Material Layout Engine — T22–T26
- **M6** Optimization — T27
- **M7** Cut List And Waste — T28–T30
- **M8** PDF Export — T31–T33
- **M9** Background Image — T34
- **M10** Polish And Validation — T35–T37

## Source of truth

The product specification is `docs/plan.md`. If a task contradicts the plan, the plan wins; raise a note in the task file's **Open questions** section and flag the conflict in this index by marking the row `blocked`.
