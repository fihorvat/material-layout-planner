# T36 — Keyboard shortcuts & polish

- **Milestone**: M10
- **Depends on**: T09, T35
- **Status**: todo

## Goal

Wire all keyboard shortcuts (plan §45), add general UX polish (error handling, empty states, focus visibility, performance fixes), and ensure the app is usable end-to-end.

## Files

```
src/features/editor/useKeyboardShortcuts.ts          (extended from T08)
src/features/editor/ShortcutsHelpDialog.tsx
src/features/editor/ErrorBoundary.tsx
src/components/Toast.tsx
src/state/toastStore.ts
```

## Full shortcut list

| Keys | Action |
|---|---|
| `V` | Activate Select tool |
| `L` | Activate Line tool |
| `R` | Activate Rectangle tool |
| `P` | Activate Polygon tool |
| `O` | Activate Opening tool |
| `F` | Activate Surface tool |
| `D` | Activate Dimension tool |
| `T` | Activate Label tool |
| `C` | Activate Connection tool |
| `X` | Activate Split Surface tool |
| `M` | Activate Pattern Origin (manual offset) tool |
| `Delete`/`Backspace` | Delete selection |
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` / `Ctrl + Y` | Redo |
| `Ctrl/Cmd + S` | Save (autosave + thumbnail capture) |
| `Ctrl/Cmd + E` | Export PDF dialog |
| `Ctrl/Cmd + O` | Import JSON |
| `Ctrl/Cmd + D` | Duplicate selection |
| `Ctrl/Cmd + A` | Select all on active layer |
| `Space + drag` | Pan |
| `Mouse wheel` | Zoom (already in T06) |
| `+` / `=` | Zoom in |
| `-` | Zoom out |
| `0` | Reset zoom |
| `Home` | Fit content |
| `Shift` (held) | Constrain angle / aspect ratio (tool-specific) |
| `Alt` (held) | Disable snapping (tool-specific) / center-anchor for rectangle |
| `Enter` | Confirm numeric input / close polygon |
| `Esc` | Cancel current action / clear selection |
| `G` | Toggle grid |
| `S` | Toggle snap |
| `?` / `F1` | Open shortcut help |

Implementation: a single `useKeyboardShortcuts` hook attached to the editor page. Each binding maps to a function. Shortcuts respect text input focus (skip when an `<input>` / `<textarea>` / contenteditable is focused). Tool shortcuts (single letter) require no modifiers.

## Help dialog

`ShortcutsHelpDialog` shows the table above grouped by category (Tools, Editing, View, File). Triggered by `?` / `F1` or "Keyboard shortcuts" menu entry.

## Toasts

`toastStore` + `Toast` component for transient messages: "Saved", "Layout regenerated", "Failed to import: …". Top-right stack. Auto-dismiss in 4 s; error toasts persist until dismissed.

Replace any `alert()` or `console.error` user-facing messages with toasts.

## Error boundary

`ErrorBoundary` wraps the editor and dashboard subtrees. On error:

- Show a recovery screen: "Something went wrong. Your last autosave is intact. Reload?".
- Log the error to console for debugging.

## Polish checklist

- All inputs visibly indicate focus.
- Color contrast ≥ 4.5:1 for body text.
- Tooltips include shortcuts.
- Spinners/Skeletons for slow operations (PDF export, optimization).
- No layout-shift jitter on resize.
- Hovered toolbar buttons show subtle bg change.
- Selected entities have a consistent halo style across all tools.
- Empty-state messages for: no surfaces, no materials, no patterns, no layouts.
- Verify there are no `console.error` or `console.warn` triggered during normal use.

## Performance pass

- Profile a 200-piece layout; confirm 50 fps pan/zoom.
- Memoize `MaterialLayoutLayer` per layout ID.
- Use `Konva.Group.clip` instead of per-piece clipping when many pieces share a surface.
- Verify autosave debounce is not racing with layout regen.

## Implementation steps

1. Extend `useKeyboardShortcuts` with the full table.
2. Build `ShortcutsHelpDialog`.
3. Build `toastStore` and `Toast` component; replace alerts.
4. Build `ErrorBoundary` and wrap subtrees.
5. Run polish checklist; fix discovered issues.
6. Run performance profiling and apply fixes.

## Decisions

- **Help is `?` / `F1`** — both common conventions; users find one or the other quickly.
- **Toasts are not persisted** — they're transient feedback.
- **Single shortcuts hook** keeps the binding table in one place.

## Open questions

_(none)_

## Acceptance criteria

- [ ] All shortcuts from the table fire the right action.
- [ ] Help dialog accessible via `?` / `F1`.
- [ ] Toasts appear and dismiss correctly.
- [ ] Error boundary catches a thrown error and offers reload.
- [ ] No alerts; all user messages via toasts.
- [ ] Performance budget met for a 200-piece scene.

## Verification

```
npm test
npm run dev   # exercise every shortcut and visual state
```

## Progress Log

_(append entries here)_
