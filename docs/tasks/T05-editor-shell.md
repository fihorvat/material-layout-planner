# T05 — Editor shell layout

- **Milestone**: M1
- **Depends on**: T03
- **Status**: todo

## Goal

Build the static editor UI skeleton from `plan.md` §8.2: top toolbar, left tool rail, center canvas area (placeholder until T06), right properties panel, bottom panel with tabs. No drawing logic yet; tools are buttons that set `editorStore.activeTool` only.

## Visual target

```
┌──────────────────────────────────────────────────────────────┐
│ Top toolbar: file, undo, redo, zoom, grid, snap, export PDF   │
├──────────────┬─────────────────────────────┬─────────────────┤
│ Left tools   │ Main 2D canvas              │ Properties      │
│              │                             │ panel           │
├──────────────┴─────────────────────────────┴─────────────────┤
│ Bottom panel: surfaces, materials, layouts, cut list, warnings │
└──────────────────────────────────────────────────────────────┘
```

Sizes:

- Top toolbar: 48 px fixed.
- Left tool rail: 56 px fixed.
- Right properties: 320 px, user-resizable 240–520 px.
- Bottom panel: 220 px, user-resizable 120–500 px, can be collapsed to 32 px (header only).
- Center canvas: fills remaining space.

Use CSS Grid for the outer layout and `pointer` drag handles for resizing. No external UI library; build minimal primitives in `src/components/`.

## Files

```
src/app/App.tsx                          (replace placeholder from T01)
src/app/AppProviders.tsx
src/features/editor/EditorPage.tsx
src/features/editor/EditorToolbar.tsx
src/features/editor/ToolRail.tsx
src/features/editor/PropertiesPanel.tsx
src/features/editor/BottomPanel.tsx
src/features/editor/CanvasPlaceholder.tsx
src/features/editor/editor.module.css
src/components/IconButton.tsx
src/components/Tabs.tsx
src/components/ResizableDivider.tsx
src/components/Tooltip.tsx
src/components/index.ts
src/features/editor/__tests__/EditorPage.test.tsx
```

## Top toolbar contents

Buttons (left to right), each `IconButton` with tooltip + shortcut:

- File menu (placeholder dropdown; full menu later in T35)
- Undo (Ctrl+Z) — calls `historyStore` (no-op until T08 lands; render disabled state correctly)
- Redo (Ctrl+Shift+Z)
- Separator
- Zoom out, Zoom %, Zoom in, Fit to content, Reset zoom — wired to `editorStore.viewport`
- Separator
- Toggle grid (G) — wired to `editorStore.gridVisible`
- Toggle snap (S) — wired to `editorStore.snapEnabled`
- Separator
- Export PDF — opens dialog (placeholder until T31)
- Right-side: project name (editable inline), dirty indicator (`•` when `projectStore.isDirty`), last saved time

## Left tool rail

Vertical icon list, each button sets `editorStore.activeTool`:

| Tool | Shortcut | Icon (text-based placeholder OK) |
|---|---|---|
| Select | V | "↖" |
| Line | L | "/" |
| Rectangle | R | "▭" |
| Polygon | P | "⬠" |
| Opening | O | "▢" |
| Surface | F | "S" |
| Dimension | D | "↔" |
| Label | T | "T" |
| Connection | C | "⌐" |
| Split surface | X | "✂" |

The active tool's button shows a highlighted state. Use real SVG icons if straightforward; otherwise text-based placeholders are acceptable in MVP.

## Right properties panel

Title bar + scrollable body. Content is decided by selection (T09+); for now show a friendly empty state: "Select an object to edit its properties." Panel must be resizable (`ResizableDivider`).

## Bottom panel

`Tabs` component with five tabs (per plan §41):

- Surfaces
- Materials
- Layouts
- Cut list
- Warnings
- Stats

Each tab body is a placeholder empty state for now. Tabs must be keyboard-navigable (arrow keys). The whole bottom panel must be collapsible via a chevron button in the header; collapsed state reduces height to 32 px and dims tab bodies.

## Components to build

### `IconButton`

```ts
type IconButtonProps = {
  label: string;
  shortcut?: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;  // icon
};
```

Renders a square 36 × 36 px button with hover, active, and focus rings. Wraps in `Tooltip` showing `label` plus shortcut if present.

### `Tabs`

```ts
type TabsProps = {
  tabs: { id: string; label: string; badge?: number }[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
};
```

Accessible tablist (`role="tablist"`, `aria-selected`). Arrow keys cycle.

### `ResizableDivider`

```ts
type ResizableDividerProps = {
  orientation: 'vertical' | 'horizontal';
  onResize: (deltaPx: number) => void;
  ariaLabel: string;
};
```

Renders a 4 px hit area; on pointer drag, emits cumulative delta. Caller clamps to min/max.

### `Tooltip`

Lightweight CSS+JS tooltip with 400 ms hover delay. No external library.

## Styling

- Use plain CSS modules (`.module.css`). No Tailwind, no styled-components.
- Color palette (light theme MVP):
  - Background `#ffffff`
  - Surface `#f8fafc`
  - Border `#e5e7eb`
  - Text `#111827`
  - Muted `#6b7280`
  - Accent `#2563eb`
- Single CSS file `src/app/theme.css` exports CSS custom properties at `:root`.

## Implementation steps

1. Create `theme.css` with CSS custom properties; import once in `main.tsx`.
2. Build the four primitives in `src/components/` with tests for keyboard behavior on `Tabs`.
3. Build the editor layout in `EditorPage.tsx` using CSS Grid; mount inside `App.tsx`.
4. Wire toolbar buttons:
   - Tool buttons → `editorStore.setActiveTool`.
   - Grid / snap toggles → `editorStore`.
   - Zoom controls → `editorStore.zoomAt` and `setViewport`.
   - Project name edit → `projectStore.patchProject(d => { d.name = next })`.
5. Persist properties / bottom panel widths to `localStorage` (key `mlp:layout`).
6. Test `EditorPage` smoke render with React Testing Library: assert toolbar buttons render, clicking the Line tool button sets `activeTool` to `'line'`.

## Decisions

- **No UI framework**: keeps bundle small and avoids opinionated styling. Components are intentionally minimal.
- **Layout persistence in `localStorage`**, not in project — it's a per-user preference, not project data.
- **Project name is editable in the toolbar** to save a click; full project metadata UI lives in the dashboard (T35).
- **CSS Modules** chosen for scoping without a runtime.

## Open questions

_(none)_

## Acceptance criteria

- [ ] Editor renders with toolbar, tool rail, placeholder canvas, properties panel, and bottom panel.
- [ ] Clicking each tool button updates `editorStore.activeTool`.
- [ ] Grid and snap toggles flip the corresponding store value.
- [ ] Right panel and bottom panel are resizable within their min/max range; sizes persist across reloads.
- [ ] Bottom panel collapses and expands.
- [ ] Project name in the toolbar is editable and updates the store.
- [ ] Tabs keyboard-navigable.
- [ ] `npm run lint`, `npm run typecheck`, `npm test` green.

## Verification

```
npm test -- src/features/editor src/components
npm run dev   # manual: click tools, drag dividers, toggle grid
```

## Progress Log

_(append entries here)_
