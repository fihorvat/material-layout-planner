# 2D Material Layout Planner

A local, browser-only React + TypeScript application for drawing measured 2D surfaces, assigning materials, and generating layouts, cut lists, and PDF documentation.

See `docs/plan.md` for the full product specification and `docs/tasks/` for the implementation task index.

## Requirements

- Node `>= 20.10`
- npm (lockfile committed)

## Setup

```sh
npm install
```

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start the Vite dev server. |
| `npm run build` | Type-check and build a production bundle into `dist/`. |
| `npm run preview` | Preview the production build locally. |
| `npm run lint` | Run ESLint over the project. |
| `npm run typecheck` | Run `tsc -b --noEmit`. |
| `npm test` | Run the Vitest suite once. |
| `npm run test:watch` | Run Vitest in watch mode. |
| `npm run format` | Format the project with Prettier. |
