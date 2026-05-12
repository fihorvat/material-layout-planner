# Conventions — shared rules for all tasks

Every agent **must** read this file before starting a task. These conventions answer the questions that would otherwise be repeated in every task file.

---

## 1. Tech stack (locked decisions)

- **Language**: TypeScript 5.x, `strict: true`.
- **Framework**: React 18 with function components and hooks.
- **Bundler / dev server**: Vite 5.x.
- **Canvas**: `react-konva` + `konva`.
- **State**: `zustand` 4.x with `immer` middleware and `subscribeWithSelector`.
- **Schema validation**: `zod` 3.x.
- **Local DB**: `idb` 8.x (typed IndexedDB wrapper).
- **PDF**: `pdf-lib` for assembly, `@pdf-lib/fontkit` for fonts; render geometry to SVG and embed via `pdf-lib`'s drawing primitives.
- **Worker**: native Web Worker via Vite's `?worker` import.
- **Testing**: `vitest` for unit/integration; `@testing-library/react` for components; `jsdom` env. Visual smoke tests via `@playwright/test` are out of MVP scope but leave hooks.
- **Linting / formatting**: ESLint (typescript-eslint, react-hooks), Prettier. No emoji in source.
- **Node**: `>= 20.10`. Package manager: `npm` (lockfile committed).

If a task needs a library not listed here, propose it in the task's **Open questions** before installing.

---

## 2. Folder layout (final)

Use exactly this structure (matches `plan.md` §43):

```
src/
  app/                       App shell, routing, providers
  components/                Reusable UI primitives (presentational)
  features/                  Feature-scoped UI (smart components)
    editor/
    drawingTools/
    surfaces/
    materials/
    placementPatterns/
    materialLayout/
    exportPdf/
    dashboard/
  domain/                    Pure logic, no React imports
    geometry/
    surfaces/
    materials/
    placementPatterns/
    materialLayout/
    pdf/
    units/
    commands/
  storage/                   IndexedDB, JSON import/export
  state/                     Zustand stores
  workers/                   Web Worker entry points
  types/                     Shared TS types and Zod schemas
  test/                      Test helpers, fixtures, mocks
```

Rules:

- `domain/**` must not import from `react`, `react-konva`, or any UI module. It must be pure and unit-testable in Node.
- `features/**` may import from `domain/**`, `components/**`, `state/**`, `storage/**`.
- `components/**` must be presentational only (no store access).
- Circular imports are forbidden; resolve via `types/`.

---

## 3. Naming

- Files: `camelCase.ts` for modules, `PascalCase.tsx` for React components.
- Types and interfaces: `PascalCase`. Use `type` aliases unless declaration merging is required.
- Zod schemas: suffix `Schema`, e.g., `MaterialSchema`. Inferred TS types use the bare name: `type Material = z.infer<typeof MaterialSchema>`.
- Test files: colocated as `foo.test.ts` or `foo.test.tsx`.
- IDs: ULIDs via `ulid` package. Functions that mint IDs are named `newXxxId()` in `domain/ids.ts`.
- Numeric fields with units: always suffix the unit, e.g., `widthMm`, `angleDeg`, `opacity01` (0..1), `wastePercent` (0..100).

---

## 4. Units and numeric precision

- **Internal unit is millimeters (mm).** Angles in degrees unless explicitly radians.
- All geometry math uses `number` (IEEE 754 double). Round only at display/export boundaries.
- Display rounding: 1 decimal for mm (e.g., `123.4 mm`), 0 decimals for ° unless `<1°`.
- The unit parser (T07) is the single entry point for user-typed dimension strings. UI inputs must call it on commit.

---

## 5. Coordinate system

- World coordinates: x → right, y → down, in millimeters. Same orientation as Konva default. **Do not** flip y; dimension labels handle orientation.
- Canvas transform: a single root `Konva.Group` holds world-to-screen scale and pan. Screen pixels = `world * scale + pan`.
- Default scale: 1 mm = 1 px at zoom 1.0. Zoom range: `0.05`–`50`.

---

## 6. State management

- One store per concern: `projectStore` (the `Project` data), `editorStore` (active tool, viewport, selection visuals), `selectionStore` (selected entity IDs), `historyStore` (undo/redo stack).
- Mutations to `projectStore` go through commands (T08). UI never sets project state directly; it dispatches a command.
- `editorStore` and `selectionStore` may be mutated directly via Zustand actions; they are transient and not persisted in the project file.
- Persisted slice: only `projectStore.project`. Autosave debounced 500 ms to IndexedDB.

---

## 7. Project schema and migrations

- The root project shape is defined by `ProjectSchema` (Zod) in `types/project.ts`.
- Every project document carries `schemaVersion: number`. Bump it whenever the schema changes; provide a migration in `storage/migrations.ts`. T04 ships v1.
- JSON import validates with the schema and runs migrations.

---

## 8. Commands and undo/redo

- All edits to `Project` data are commands implementing:
  ```ts
  interface Command<TPayload = unknown> {
    id: string;
    label: string;
    payload: TPayload;
    apply(project: Project): Project;
    invert(project: Project): Command;
  }
  ```
- `historyStore` keeps two stacks: `past`, `future`. Max depth 200 by default.
- Commands must be pure given `project` + `payload`; do not capture mutable closures.
- Transient interactions (e.g., dragging a handle) emit a single command on `pointerup`, not on every move.

---

## 9. Code style

- No default exports except for React page components used by the router.
- Prefer `const` arrow components. No `React.FC`.
- No `any`. Use `unknown` + narrowing. `// eslint-disable` requires a comment explaining why.
- No comments unless they explain *why*, not *what*. Do not document obvious code.
- No emoji in code, identifiers, or PR descriptions.

---

## 10. Testing rules

- Each `domain/**` module must have unit tests covering documented behavior and listed edge cases.
- Tests live alongside source: `foo.ts` + `foo.test.ts`.
- Integration tests for feature workflows live in `src/test/integration/`.
- A task is not `done` until: (a) its acceptance criteria pass, (b) tests it added are green, (c) the whole suite (`npm test`) is green.
- Snapshot tests are forbidden for geometry outputs; assert numerically with tolerance `1e-6 mm`.

---

## 11. Performance budgets

- Pan/zoom must stay above 50 fps with up to 5 000 material pieces visible.
- Layout generation for a single 5 m² surface with 600×300 mm material must complete in <100 ms on the main thread; optimization (multiple candidates) runs in the worker (T27) and may take up to 2 s.
- Avoid re-rendering Konva layers; throttle pointer moves and use `Konva.Layer.batchDraw()`.

---

## 12. Accessibility & UX

- All inputs reachable by keyboard; focus visible.
- Numeric inputs accept "600", "60 cm", "0.6 m". Invalid input shows inline error and rejects on Enter.
- Tooltips on every toolbar button with name + shortcut.

---

## 13. Progress logging (mandatory)

Every task file ends with a **Progress Log** section. Append an entry whenever you start, pause, or finish work on the task. Format:

```
### YYYY-MM-DD HH:MM — <agent label or initials>
- status: in_progress | review | done | blocked
- summary: one-line summary of what changed
- commits: <hash list or "uncommitted">
- next: what is left
- blockers: list or "none"
```

Also update the row in `README.md` whenever Status changes.

---

## 14. Definition of Done (applies to every task)

A task is `done` only when **all** are true:

1. All deliverables in the task's **Deliverables** section exist and are wired up.
2. All acceptance criteria in the task's **Acceptance criteria** section pass manually or via tests.
3. New code has unit tests where the task lists them.
4. `npm run lint`, `npm run typecheck`, and `npm test` pass on a clean install.
5. No regressions in earlier tasks' acceptance criteria.
6. Progress Log shows a final `done` entry.
7. `docs/tasks/README.md` row updated.

---

## 15. Open question protocol

If a task's instructions are ambiguous or contradict `docs/plan.md`:

1. Do **not** guess silently.
2. Append the question to the task's **Open questions** section with a proposed answer.
3. Set task status to `blocked` and update the index.
4. Continue with parts of the task that are not blocked.
