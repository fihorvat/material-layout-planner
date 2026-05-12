# T04 — Local persistence (IndexedDB + JSON)

- **Milestone**: M1
- **Depends on**: T02, T03
- **Status**: todo

## Goal

Persist projects locally with IndexedDB, support autosave, and provide JSON import/export. Storage code knows nothing about UI; it consumes/produces validated `Project` objects.

## Deliverables

### IndexedDB schema (`src/storage/indexedDb.ts`)

Database `material-layout-planner` version `1`. Object stores:

| Store | Key | Value | Indexes |
|---|---|---|---|
| `projects` | `id` (string) | `ProjectRecord` | `updatedAt`, `name` |
| `blobs` | `key` (string) | `Blob` | — |
| `thumbnails` | `projectId` (string) | `Blob` | — |

```ts
type ProjectRecord = {
  id: string;
  name: string;
  schemaVersion: number;
  updatedAt: string;   // ISO
  createdAt: string;   // ISO
  project: Project;    // validated by ProjectSchema
};
```

Export typed helpers using `idb`'s `openDB<MyDB>()` with `DBSchema`.

### Repository (`src/storage/projectRepository.ts`)

```ts
type ProjectSummary = {
  id: string;
  name: string;
  updatedAt: string;
  createdAt: string;
  surfaceCount: number;
  materialCount: number;
  thumbnailBlob?: Blob;
};

export interface ProjectRepository {
  listProjects(): Promise<ProjectSummary[]>;
  getProject(id: string): Promise<Project | null>;
  saveProject(project: Project): Promise<void>;
  deleteProject(id: string): Promise<void>;
  duplicateProject(id: string, newName: string): Promise<Project>;
  putBlob(key: string, blob: Blob): Promise<void>;
  getBlob(key: string): Promise<Blob | null>;
  deleteBlob(key: string): Promise<void>;
  putThumbnail(projectId: string, blob: Blob): Promise<void>;
  getThumbnail(projectId: string): Promise<Blob | null>;
}

export const createProjectRepository = (): ProjectRepository => { /* ... */ };
```

- `saveProject` validates with `ProjectSchema` before writing; throws on invalid input.
- `getProject` validates after reading and runs migrations (see below).

### Migrations (`src/storage/migrations.ts`)

```ts
type Migration = { from: number; to: number; migrate: (raw: unknown) => unknown };
export const migrations: Migration[] = []; // empty in MVP — schemaVersion 1 is current
export const migrateProject = (raw: unknown): Project => { /* applies in order, then ProjectSchema.parse */ };
```

Even with no migrations yet, build the pipeline so future versions only add entries.

### Autosave (`src/storage/autosave.ts`)

```ts
export const startAutosave = (opts: {
  repo: ProjectRepository;
  intervalMs?: number;   // default 500
  enabled?: () => boolean;
}) => { /* returns stop() function */ };
```

Behavior:

- Subscribe to `projectStore` via `useProjectStore.subscribe((s) => s.project)`.
- On change, debounce 500 ms, then call `repo.saveProject(project)` and `projectStore.getState().markSaved(...)`.
- Skip if `opts.enabled()` returns false (used during bulk operations).
- Errors logged via `console.error` and surfaced through a global error event (T26 will wire warnings UI; for now, `console.error` is acceptable).

### JSON import/export (`src/storage/jsonImportExport.ts`)

```ts
export const exportProjectToJson = (project: Project): Blob;
export const downloadProjectJson = (project: Project): void;          // triggers <a download>
export const parseProjectFromJson = (text: string): Project;          // validates + migrates
export const pickAndImportProjectJson = (): Promise<Project | null>;  // file input
```

- Exported JSON: pretty-printed, two-space indent, UTF-8.
- File name: `${slugify(project.name)}-${project.id.slice(-6)}.mlp.json`.
- Import validates with `ProjectSchema`; surface a clear error message if invalid.

### `localStorage` preferences (`src/storage/preferences.ts`)

```ts
type Preferences = {
  lastOpenedProjectId: string | null;
  theme: 'light' | 'dark';
  gridSizeMm: number;
  lastUsedUnit: 'mm' | 'cm' | 'm';
};
export const loadPreferences = (): Preferences;
export const savePreferences = (p: Preferences): void;
```

Keys are namespaced under `mlp:preferences`. Tolerate parse errors (return defaults).

## Files

```
src/storage/indexedDb.ts
src/storage/projectRepository.ts
src/storage/migrations.ts
src/storage/autosave.ts
src/storage/jsonImportExport.ts
src/storage/preferences.ts
src/storage/index.ts
src/storage/__tests__/projectRepository.test.ts
src/storage/__tests__/jsonImportExport.test.ts
src/storage/__tests__/migrations.test.ts
```

## Implementation steps

1. Install `fake-indexeddb` as a dev dependency for tests:
   - `npm i -D fake-indexeddb`
   - In `src/test/setup.ts`, add `import 'fake-indexeddb/auto'` so jsdom gets `indexedDB`.
2. Implement `indexedDb.ts` using `idb` with `DBSchema` for typed stores and indexes.
3. Implement repository with the methods above; each method opens the DB lazily via a cached promise.
4. Implement migrations pipeline; export `CURRENT_SCHEMA_VERSION = 1`.
5. Implement JSON import/export; use `Blob` + `URL.createObjectURL` for download.
6. Implement autosave hooked into `useProjectStore.subscribe`.
7. Tests:
   - Save → list → get round-trips a project.
   - `saveProject` rejects invalid input (e.g., missing `name`).
   - `duplicateProject` returns a project with a new ID, new `createdAt`/`updatedAt`, identical other fields, and writes it.
   - `parseProjectFromJson` succeeds for an exported project.
   - `parseProjectFromJson` fails clearly for malformed input.
   - Autosave: simulate two store updates within 100 ms → only one `saveProject` call; advance time → second batch triggers another save.

## Decisions

- **Why IndexedDB for projects + blobs**: localStorage's 5 MB cap is too small for background images.
- **Why `idb`**: small, typed, well-maintained wrapper. No Dexie to keep deps lean.
- **Autosave default 500 ms** balances responsiveness and write churn; configurable.
- **Validate on read**: a corrupted DB row throws and gets surfaced to the dashboard; we never load garbage into the store.
- **Blob storage key format**: `bg:${projectId}:${entityId}` so cleanup on project delete can prefix-scan and remove blobs.

## Open questions

_(none)_

## Acceptance criteria

- [ ] All files exist and types are exported via `storage/index.ts`.
- [ ] Repository tests pass with `fake-indexeddb`.
- [ ] JSON export then import yields a deep-equal project.
- [ ] Autosave debounce verified by test with fake timers.
- [ ] `npm run lint`, `npm run typecheck`, `npm test` green.
- [ ] Project delete also removes its blobs and thumbnail (test).

## Verification

```
npm test -- src/storage
npm run typecheck
```

## Progress Log

### 2026-05-12 19:18 — Cascade
- status: review
- summary: IndexedDB schema, repository, migrations pipeline, JSON import/export, autosave (debounced), and localStorage preferences in place; fake-indexeddb wired in test setup; jsdom Blob swapped for node:buffer Blob to expose text(); all 21 storage tests pass
- commits: uncommitted
- next: T35 dashboard will consume listProjects/duplicate/delete
- blockers: none
