# T03 — State management (Zustand stores)

- **Milestone**: M1
- **Depends on**: T02
- **Status**: todo

## Goal

Provide four Zustand stores with strict typing, immer middleware where mutation is needed, and a clear separation between *persistent* project state and *transient* editor state.

## Stores to build

### 1. `projectStore` — `src/state/projectStore.ts`

Holds the current `Project` (the persistent document).

State:

```ts
type ProjectState = {
  project: Project;
  isDirty: boolean;
  lastSavedAt: string | null;
};
```

Actions (used internally; UI calls these through commands in T08, never directly):

```ts
replaceProject(next: Project): void;        // used by load, import, undo/redo
patchProject(producer: (draft: Project) => void): void; // immer
markSaved(savedAt: string): void;
```

Rules:

- Use `subscribeWithSelector` + `immer` middleware.
- After any patch, set `isDirty = true` and bump `project.updatedAt = new Date().toISOString()`.
- `replaceProject` does **not** flip `isDirty`; loaders decide.

### 2. `editorStore` — `src/state/editorStore.ts`

Transient editor UI state. Not persisted.

```ts
type ToolId =
  | 'select' | 'line' | 'rectangle' | 'polygon'
  | 'opening' | 'dimension' | 'label'
  | 'surface' | 'connection' | 'patternOrigin'
  | 'splitSurface' | 'calibrateImage';

type Viewport = { offsetXPx: number; offsetYPx: number; scale: number };

type LayerVisibility = Record<LayerId, { visible: boolean; locked: boolean; opacity01: number }>;

type EditorState = {
  activeTool: ToolId;
  viewport: Viewport;
  snapEnabled: boolean;
  snapTolerancePx: number;
  gridVisible: boolean;
  layers: LayerVisibility;
  pendingDraw: PendingDrawState | null;  // tool-specific scratch state (line first click, polygon points so far)
  hoverEntityId: string | null;
};
```

Actions:

```ts
setActiveTool, setViewport, panBy, zoomAt(point, factor),
toggleLayerVisible, toggleLayerLocked, setLayerOpacity,
setGridVisible, setSnap, setHover,
setPendingDraw, clearPendingDraw,
```

`LayerId` enum per plan §31:

```
'backgroundImage' | 'construction' | 'surfaces' | 'openings'
| 'dimensions' | 'materialLayout' | 'overlap' | 'labels'
| 'helpers' | 'warnings'
```

### 3. `selectionStore` — `src/state/selectionStore.ts`

```ts
type SelectableKind =
  | 'point' | 'line' | 'rectangle' | 'polygon'
  | 'surface' | 'opening' | 'dimension' | 'label'
  | 'materialPiece' | 'patternHandle' | 'overlap' | 'backgroundImage';

type SelectionEntry = { kind: SelectableKind; id: string };

type SelectionState = {
  selected: SelectionEntry[];
};
```

Actions: `select(entry, additive?)`, `selectMany(entries)`, `clear()`, `toggle(entry)`, `removeFromSelection(id)`.

### 4. `historyStore` — `src/state/historyStore.ts`

Owned by T08 logically, but the slice is registered here so other code can subscribe to size for UI badges.

```ts
type HistoryState = {
  past: Command[];   // applied
  future: Command[]; // undone, available for redo
  maxDepth: number;  // default 200
};
```

Actions: `pushApplied(cmd)`, `popUndo()`, `popRedo()`, `clear()`. (T08 implements the full apply/invert logic; T03 only defines the slice and trivial actions.)

## Cross-cutting

- All store factories use `create<TState>()(...)` with explicit generics; no inferred `any`.
- Provide `useProjectStore`, `useEditorStore`, `useSelectionStore`, `useHistoryStore` as the canonical hooks.
- Provide non-hook accessors `getProject()`, `getEditor()`, etc., for use inside commands and domain code.
- No `any`. No re-exporting Zustand's internals.

## Files

```
src/state/projectStore.ts
src/state/editorStore.ts
src/state/selectionStore.ts
src/state/historyStore.ts
src/state/index.ts          (barrel)
src/state/__tests__/projectStore.test.ts
src/state/__tests__/editorStore.test.ts
src/state/__tests__/selectionStore.test.ts
```

## Implementation steps

1. Install nothing new — `zustand` and `immer` were installed in T01.
2. Implement `projectStore` with the immer middleware; seed with `createEmptyProject('Untitled')` from T02.
3. Implement `editorStore` with sensible defaults (tool `select`, viewport `{0,0,1}`, all layers visible/unlocked/opacity 1, grid visible, snap on with tolerance 8 px).
4. Implement `selectionStore` and `historyStore`.
5. Tests:
   - `projectStore.patchProject` flips `isDirty` and bumps `updatedAt`.
   - `replaceProject` resets `isDirty: false` when used to load.
   - `editorStore.zoomAt({x:100,y:100}, 2)` keeps the world-point under the cursor stationary (assert math within `1e-6`).
   - `selectionStore.toggle` adds when absent and removes when present.
   - `historyStore.pushApplied` enforces `maxDepth` by trimming the oldest entry.

## Decisions

- **Stores are singletons**, not React Context. Tests reset state via `useXStore.setState(initialState)` helpers exported from each store file.
- **Persistence is not in the store**. T04's repository subscribes and persists. Keeps stores framework-free.
- **`zoomAt` math**: given pointer screen position `p` and zoom factor `f`, new offset is `p - (p - oldOffset) * f`. Implement and unit-test.

## Open questions

_(none)_

## Acceptance criteria

- [ ] Four stores exist with the listed shape and actions.
- [ ] Tests pass.
- [ ] `npm run typecheck` green.
- [ ] No store imports React.

## Verification

```
npm test -- src/state
npm run typecheck
```

## Progress Log

_(append entries here)_
