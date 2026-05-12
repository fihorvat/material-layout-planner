# T35 — Project dashboard & JSON import/export

- **Milestone**: M10
- **Depends on**: T04
- **Status**: todo

## Goal

Build the project dashboard (plan §8.1) for managing multiple local projects and expose JSON import/export from both the dashboard and the editor.

## Files

```
src/features/dashboard/DashboardPage.tsx
src/features/dashboard/ProjectCard.tsx
src/features/dashboard/NewProjectDialog.tsx
src/features/dashboard/RenameProjectDialog.tsx
src/features/dashboard/DuplicateProjectDialog.tsx
src/features/dashboard/ImportProjectDialog.tsx
src/features/dashboard/useDashboard.ts
src/app/routes.tsx
src/app/AppRouter.tsx
```

## Routing

Add a minimal client-side router (no `react-router-dom` to keep deps lean; implement a tiny route resolver):

- `#/` → Dashboard
- `#/project/${id}` → Editor for that project

Hash routing avoids the need for server config (true local app).

Implementation in `AppRouter.tsx`:

```ts
const useRoute = (): Route => { /* parse window.location.hash, subscribe to hashchange */ };
```

`App.tsx` chooses `<DashboardPage />` or `<EditorPage projectId={id} />`. On editor mount, `useDashboard` loads the project via `projectRepository.getProject(id)` and feeds it to `projectStore.replaceProject`.

## Dashboard content

Top bar: app name, "New project" button, "Import JSON" button.

Project grid:

- `ProjectCard` per project (queried via `repository.listProjects()`):
  - Thumbnail (if any)
  - Project name
  - Last modified date (relative + absolute on hover)
  - Surface count, material count
  - Action menu: Open, Rename, Duplicate, Export JSON, Delete

Empty state: friendly message + "Create your first project".

Sort: Recent (default), Name, Created date.

Search: simple substring filter on `name`.

## Thumbnails

After autosave or on demand, capture the canvas as a PNG thumbnail:

- `useThumbnailCapture` hook: every 30 s while editing, render the Konva stage to a 256 × 256 JPEG (via `stage.toDataURL`). Store via `repository.putThumbnail(projectId, blob)`.
- Skip captures when there are no surfaces yet.

## Dialogs

- **NewProjectDialog**: name input, "Create" button → `repository.saveProject(createEmptyProject(name))` then navigate to editor.
- **RenameProjectDialog**: pre-filled with current name.
- **DuplicateProjectDialog**: pre-filled with `${name} (copy)`. Calls `repository.duplicateProject`.
- **ImportProjectDialog**: file input. Calls `parseProjectFromJson` and `saveProject`; navigate to editor on success.
- **DeleteProjectConfirm**: simple confirm.

## Editor integration

- File menu in toolbar gets entries: New, Open dashboard, Save (forces autosave + thumbnail capture), Export JSON, Import JSON (warns if current project is unsaved or replaces it on confirm).
- Toolbar shows project name + dropdown to switch projects (lists recent 5).

## Implementation steps

1. Build `AppRouter` and route into `App.tsx`.
2. Build dashboard page and components.
3. Build dialogs.
4. Build thumbnail capture hook and wire to autosave or interval.
5. Wire editor file menu actions.

## Decisions

- **Hash routing** keeps the app fully offline and host-agnostic.
- **No URL params** — project ID is in the hash only.
- **Thumbnails are JPEG** (smaller than PNG for photo-like content) at 256 × 256.

## Open questions

_(none)_

## Acceptance criteria

- [ ] Dashboard lists existing projects with thumbnails and metadata.
- [ ] Create / rename / duplicate / delete / export / import work.
- [ ] Navigating to editor loads the chosen project; back to dashboard returns.
- [ ] Thumbnails capture and display.
- [ ] Importing an invalid JSON shows a clear error and does not save it.
- [ ] Tests for `useDashboard` happy path.

## Verification

```
npm test -- src/features/dashboard
npm run dev   # manual: create, open, export, import, duplicate, delete
```

## Progress Log

_(append entries here)_
