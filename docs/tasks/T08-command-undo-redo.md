# T08 — Command pattern & undo/redo

- **Milestone**: M2
- **Depends on**: T03
- **Status**: todo

## Goal

Implement the command system that mediates every mutation of `Project` and powers undo/redo. All subsequent tool tasks (T09+) emit commands instead of patching the store directly.

## Files

```
src/domain/commands/types.ts
src/domain/commands/dispatcher.ts
src/domain/commands/registry.ts
src/domain/commands/builtin/replaceProjectCommand.ts
src/domain/commands/builtin/addDrawingEntityCommand.ts
src/domain/commands/builtin/updateDrawingEntityCommand.ts
src/domain/commands/builtin/deleteDrawingEntityCommand.ts
src/domain/commands/builtin/changeProjectSettingsCommand.ts
src/domain/commands/index.ts
src/domain/commands/__tests__/dispatcher.test.ts
src/domain/commands/__tests__/builtin.test.ts
```

(Surface, material, pattern, layout, etc. commands are added in their own tasks.)

## Core types — `types.ts`

```ts
export type CommandContext = {
  project: Project;
  // future: clock, idFactory for determinism in tests
};

export type CommandResult = {
  project: Project;        // new project
  inverse: Command;        // the command that undoes this one
};

export interface Command<TPayload = unknown> {
  readonly id: string;     // ULID for this instance, useful for debugging
  readonly type: string;   // stable registry key, e.g., 'addDrawingEntity'
  readonly label: string;  // human-readable for undo menu
  readonly payload: TPayload;
  apply(ctx: CommandContext): CommandResult;
}

export type CommandFactory<TPayload> = (payload: TPayload, label?: string) => Command<TPayload>;
```

## Dispatcher — `dispatcher.ts`

```ts
export const dispatchCommand = (cmd: Command): void;
export const undo = (): boolean;   // returns true if something was undone
export const redo = (): boolean;
export const canUndo = (): boolean;
export const canRedo = (): boolean;
```

Behavior:

1. `dispatchCommand(cmd)`:
   - Read current project via `useProjectStore.getState().project`.
   - Call `cmd.apply({ project })`.
   - Push the returned `inverse` onto `historyStore.past`.
   - Clear `historyStore.future`.
   - Trim `past` to `maxDepth`.
   - Call `useProjectStore.getState().replaceProject(result.project)` and set `isDirty: true` and bump `updatedAt`.
2. `undo()`:
   - Pop top of `past`. If none, return `false`.
   - Apply it; push its `inverse` onto `future`.
   - Replace project.
3. `redo()`:
   - Pop top of `future`. Apply; push inverse onto `past`. Replace project.
4. All operations are synchronous and atomic; never partial.

## Built-in commands

### `replaceProjectCommand`

```ts
export const replaceProjectCommand: CommandFactory<{ next: Project }>;
```

Wholesale project replacement. Used by JSON import (T35) and project open. Inverse re-creates the previous project. Pruned by `maxDepth` aggressively.

### `addDrawingEntityCommand`

```ts
export const addDrawingEntityCommand: CommandFactory<{ entity: DrawingEntity }>;
```

Appends to `project.drawingEntities`. Inverse deletes by ID.

### `updateDrawingEntityCommand`

```ts
export const updateDrawingEntityCommand: CommandFactory<{
  id: string;
  patch: Partial<DrawingEntity>;   // type-safe via discriminated union
}>;
```

Inverse stores the previous fields and re-applies them.

### `deleteDrawingEntityCommand`

```ts
export const deleteDrawingEntityCommand: CommandFactory<{ id: string }>;
```

Removes entity. Inverse re-inserts it at its original index.

### `changeProjectSettingsCommand`

```ts
export const changeProjectSettingsCommand: CommandFactory<{ patch: Partial<ProjectSettings> }>;
```

Patches `project.settings`. Inverse restores the prior values for the patched keys only.

## Registry — `registry.ts`

A simple Map from `type` to factory, used for JSON deserialization of command history (out of MVP scope but the type field is required so future versions can persist history).

```ts
export const registerCommand = <TPayload>(type: string, factory: CommandFactory<TPayload>): void;
export const getCommandFactory = (type: string): CommandFactory<unknown> | undefined;
```

Register every built-in command at module load.

## Keyboard wiring (in `T05`'s toolbar, completed here)

- `Ctrl/Cmd + Z` → `undo()`
- `Ctrl/Cmd + Shift + Z` or `Ctrl + Y` → `redo()`
- Undo/Redo toolbar buttons reflect `canUndo` / `canRedo`.

Implement a small `useKeyboardShortcuts` hook in `src/features/editor/useKeyboardShortcuts.ts` that the `EditorPage` mounts.

## Implementation steps

1. Create `types.ts` and `dispatcher.ts`.
2. Implement the five built-in commands. Each must:
   - Be pure (no DOM, no store access inside `apply`).
   - Produce a new `Project` via immer or manual shallow cloning.
   - Provide a precise inverse.
3. Wire `dispatchCommand` to call `projectStore.replaceProject` and update history.
4. Add the keyboard shortcut hook and mount it in `EditorPage`.
5. Tests:
   - Dispatch → undo → state equals starting state.
   - Dispatch → undo → redo → state equals after-dispatch.
   - Two dispatches → undo twice → starting state.
   - Dispatch after undo clears `future`.
   - `maxDepth = 3`: four dispatches keep only the last three undoable.
   - `addDrawingEntity` adds entity; inverse is delete; redo brings it back.
   - `updateDrawingEntity`: patch then undo restores exact prior values.

## Decisions

- **Inverse stored as a `Command` instance**, not a JSON snapshot. This keeps memory bounded for big projects since most edits are localized.
- **`replaceProject` command** exists as a fallback for operations whose precise inverse is too expensive (e.g., import). It captures full snapshots.
- **No async commands** in MVP. All mutations are synchronous.
- **History is in-memory only**; not persisted with the project file. Re-opening a project resets the undo stack.

## Open questions

_(none)_

## Acceptance criteria

- [ ] Built-in commands behave as specified.
- [ ] Keyboard shortcuts undo/redo work in the running app.
- [ ] Tests pass.
- [ ] `dispatchCommand` updates `isDirty` and `updatedAt`.
- [ ] Inverse correctness verified for every built-in via tests.

## Verification

```
npm test -- src/domain/commands
npm run dev   # manual: trigger an addDrawingEntity command, ctrl+z, ctrl+shift+z
```

## Progress Log

_(append entries here)_
