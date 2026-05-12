# T01 — Project bootstrap & tooling

- **Milestone**: M1
- **Depends on**: —
- **Status**: review

## Goal

Stand up an empty, runnable React + TypeScript app with the locked tech stack, the folder skeleton from `conventions.md` §2, and all tooling (lint, format, typecheck, test). No business logic yet — just a working dev loop.

## Deliverables

1. `package.json` at repo root with scripts: `dev`, `build`, `preview`, `lint`, `typecheck`, `test`, `test:watch`, `format`.
2. Vite 5 + React 18 + TypeScript 5 strict configuration.
3. Folder skeleton (empty `index.ts` placeholders are fine) matching `conventions.md` §2.
4. ESLint config (`eslint.config.js`, flat config) with `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`.
5. Prettier config (`.prettierrc.json`) with `printWidth: 100`, `singleQuote: true`, `trailingComma: "all"`.
6. Vitest config with jsdom env, `globals: true`, and a single placeholder test that asserts `1 + 1 === 2` passing.
7. `tsconfig.json` strict, with path alias `@/* -> src/*`.
8. `.gitignore` covering `node_modules`, `dist`, `coverage`, `.idea`, `.vscode`, `*.log`.
9. `index.html` with `<div id="root" />` and a `<title>2D Material Layout Planner</title>`.
10. `src/app/App.tsx` rendering a simple shell: full-viewport flex container with header text "2D Material Layout Planner".
11. `src/main.tsx` mounting `<App />` to `#root` in `React.StrictMode`.
12. `README.md` at repo root with: install, dev, test, build commands.

## Files to create

```
package.json
package-lock.json (generated)
tsconfig.json
tsconfig.node.json
vite.config.ts
vitest.config.ts            (or merge into vite.config.ts via test field)
eslint.config.js
.prettierrc.json
.prettierignore
.gitignore
index.html
README.md
src/main.tsx
src/app/App.tsx
src/vite-env.d.ts
src/test/setup.ts
src/test/smoke.test.ts
src/components/.gitkeep
src/features/editor/.gitkeep
src/features/drawingTools/.gitkeep
src/features/surfaces/.gitkeep
src/features/materials/.gitkeep
src/features/placementPatterns/.gitkeep
src/features/materialLayout/.gitkeep
src/features/exportPdf/.gitkeep
src/features/dashboard/.gitkeep
src/domain/geometry/.gitkeep
src/domain/surfaces/.gitkeep
src/domain/materials/.gitkeep
src/domain/placementPatterns/.gitkeep
src/domain/materialLayout/.gitkeep
src/domain/pdf/.gitkeep
src/domain/units/.gitkeep
src/domain/commands/.gitkeep
src/storage/.gitkeep
src/state/.gitkeep
src/workers/.gitkeep
src/types/.gitkeep
```

## Dependencies to install

Production:

```
react@^18.3 react-dom@^18.3
react-konva@^18 konva@^9
zustand@^4 immer@^10
zod@^3
idb@^8
pdf-lib@^1 @pdf-lib/fontkit@^1
ulid@^2
```

Dev:

```
typescript@^5.5
@types/react@^18 @types/react-dom@^18
vite@^5 @vitejs/plugin-react@^4
vitest@^2 jsdom@^25 @testing-library/react@^16 @testing-library/jest-dom@^6
eslint@^9 typescript-eslint@^8 eslint-plugin-react-hooks@^5 eslint-plugin-react-refresh@^0.4
prettier@^3
```

Install them in one `npm install`.

## Implementation steps

1. Run `npm init -y`. Edit `package.json` to set `"type": "module"`, name `2d-material-layout-planner`, version `0.1.0`, private `true`.
2. Install dependencies listed above.
3. Add scripts:
   - `"dev": "vite"`
   - `"build": "tsc -b && vite build"`
   - `"preview": "vite preview"`
   - `"lint": "eslint ."`
   - `"typecheck": "tsc -b --noEmit"`
   - `"test": "vitest run"`
   - `"test:watch": "vitest"`
   - `"format": "prettier --write ."`
4. Create `tsconfig.json` (strict, `moduleResolution: bundler`, `jsx: react-jsx`, `paths: { "@/*": ["src/*"] }`).
5. Create `vite.config.ts` with `@vitejs/plugin-react`, alias `@` → `src`, and Vitest `test` config (`environment: 'jsdom'`, `setupFiles: ['./src/test/setup.ts']`, `globals: true`).
6. Create `src/test/setup.ts` importing `@testing-library/jest-dom`.
7. Create `src/test/smoke.test.ts` with `expect(1 + 1).toBe(2)`.
8. Create `src/main.tsx` and `src/app/App.tsx` per Deliverables 10–11.
9. Create the folder skeleton — add empty `.gitkeep` to each folder listed above.
10. Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`. All must pass.

## Decisions (answered)

- **Why Vite, not Next.js / CRA?** Pure client app, no SSR; Vite is fastest dev loop and supports Web Workers natively.
- **Why npm?** Single agreed package manager keeps lockfile deterministic. Do not introduce pnpm/yarn.
- **Why ULID for IDs?** Sortable, URL-safe, no central registry, smaller than UUIDs.
- **Why path alias `@/`?** Avoids brittle `../../../` chains; configured in both TS and Vite.
- **Strict mode** is mandatory; do not disable `noImplicitAny` or `strictNullChecks`.

## Open questions

_(none — answer here if any arise)_

## Acceptance criteria

- [x] `npm install` completes with no errors on a fresh clone.
- [x] `npm run dev` boots and Vite reports a local URL.
- [x] Visiting the dev URL renders the header text "2D Material Layout Planner".
- [x] `npm run lint` exits 0.
- [x] `npm run typecheck` exits 0.
- [x] `npm test` exits 0 and runs at least one test.
- [x] `npm run build` produces a `dist/` folder and exits 0.
- [x] Folder skeleton from `conventions.md` §2 exists on disk.

## Verification

Ran locally on Windows (Node v24.15.0, npm 11.12.1):

- `npm install` → 303 packages added, exit 0.
- `npm run lint` (`eslint .`) → exit 0, no findings.
- `npm run typecheck` (`tsc -b --noEmit`) → exit 0.
- `npm test` (`vitest run`) → 1 file, 1 test passed, exit 0.
- `npm run build` (`tsc -b && vite build`) → `dist/index.html` + `dist/assets/index-*.js` produced, exit 0.
- `npm run dev` → Vite reported `http://localhost:5173/`.

## Progress Log

### 2026-05-12 19:05 — Cascade
- status: review
- summary: bootstrapped Vite 5 + React 18 + TS 5 strict app; added ESLint flat config, Prettier, Vitest (jsdom) with smoke test, full folder skeleton per `conventions.md` §2, app shell rendering the header, README with scripts.
- commits: uncommitted
- next: human review of T01, then proceed to T02 (type system & domain models).
- blockers: none
