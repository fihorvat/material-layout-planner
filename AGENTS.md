# AGENTS.md

This file is the contract that every AI coding agent (Cascade, Codex,
Cursor, Aider, Claude Code, …) and every human contributor must follow
when working in this repository.

It is read in addition to `docs/tasks/README.md` and `docs/plan.md`. If
two documents disagree, this file wins for rules about **documentation
parity** and **commit hygiene**; `docs/plan.md` wins for product
behaviour.

## Repositories at a glance

There are two repositories that have to stay in sync:

| Repo | Purpose |
|------|---------|
| [`fihorvat/material-layout-planner`](https://github.com/fihorvat/material-layout-planner) | Application source — this repo. |
| [`fihorvat/material-layout-planner.wiki`](https://github.com/fihorvat/material-layout-planner/wiki) | Long-form product / feature documentation. One page per user-visible feature. |

Whenever a change in this repo affects user-visible behaviour, the wiki
**must** be updated in the same logical change set.

## Mandatory rules

### 1. Every feature must be documented in the wiki

- Every feature listed in the project `README.md` has its own page in the
  wiki. The page is the canonical user-facing documentation for that
  feature.
- A "feature" is **any** user-visible capability — a tool, a panel, an
  export format, a keyboard shortcut surface, a setting, a workflow.
- New features are not considered complete until:
  1. They are merged in this repository, **and**
  2. A wiki page (or section in an existing wiki page) explains what
     they do, how to use them, and where they live in the codebase.

### 2. Every change must update the wiki

When you change behaviour in this repo, you must also:

1. Locate the wiki page(s) covering the affected feature
   (start from [`Home`](https://github.com/fihorvat/material-layout-planner/wiki/Home)
   or the README's "Quick links" section).
2. Update the page(s) so they describe the new behaviour, removed
   behaviour, and any new edge cases, settings, or shortcuts.
3. Cross-reference any new code paths so the wiki keeps pointing at the
   right files / functions.
4. Commit the wiki change in the wiki repo following the same
   Conventional Commits rules as this repo.

A pull request that changes user-visible behaviour without a matching
wiki update is incomplete and should not be merged.

### 3. Refactors that change public APIs also touch the wiki

Renames, behaviour-preserving refactors, or restructured panels still
require a wiki update if they change what the user sees, what the
keyboard shortcut is, what a setting is called, where to click, or which
file an advanced user would inspect.

Pure internal refactors that have no user-visible effect do **not**
require a wiki update — but you still need to confirm that the wiki
"Where this lives in the codebase" section is still correct, and update
it if file paths or function names changed.

### 4. Conventional Commits — enforced in both repos

Both the application repo and the wiki repo use
[`@commitlint/config-conventional`](https://www.npmjs.com/package/@commitlint/config-conventional)
with a husky `commit-msg` hook. Examples of acceptable subjects:

- `feat: add edge-rule editor to surface properties`
- `fix(pdf): wrap cut-list table when running into footer`
- `docs: clarify two-point calibration math`
- `refactor: extract drawing tool shell hook`
- `chore: bump pdf-lib to 1.17.1`
- `test: cover overlap rendering across connections`

Body lines wrap at **100 characters**. The hook will reject everything
that doesn't comply, so test your message locally before opening a PR.

### 5. Keep history clean

- Group related work into focused commits.
- For the wiki repo, **one feature per commit** is the rule — the
  history should read like a feature catalogue, not a stream of
  micro-edits.
- Rewriting history is allowed on feature branches but never on
  `master`. The only exceptions are the documented initial history
  cleanups already performed in the wiki repo.

## Workflow checklist for agents

Before opening a pull request, the agent must self-verify:

- [ ] `npm test` passes.
- [ ] `npm run lint` and `npm run typecheck` pass.
- [ ] Any task file under `docs/tasks/` you touched has its
      **Progress Log** updated and its **Status** column adjusted.
- [ ] If user-visible behaviour changed, the matching wiki page(s) are
      updated and committed in the wiki repo with a Conventional Commits
      message.
- [ ] The commit messages in this repo satisfy
      `@commitlint/config-conventional` (run a dry commit locally if in
      doubt).
- [ ] New user-visible features have at least one matching
      [info entry](src/features/info/infoEntries.ts) so the in-app
      contextual help also describes them.

## How to update the wiki

The wiki is a separate git repository. To clone and contribute:

```sh
git clone https://github.com/fihorvat/material-layout-planner.wiki.git
cd material-layout-planner.wiki
npm install                 # installs commitlint + husky hooks
# edit / add Markdown pages
git add <page>.md
git commit -m "docs: ..."   # husky enforces Conventional Commits
git push
```

Filenames follow the GitHub Wiki convention: dashes in the filename
appear as spaces in the page title. Use `_Sidebar.md` and `_Footer.md`
to update navigation chrome.

## When in doubt

- Default to **more** documentation, not less.
- If a feature is too complex to describe in prose, add a step-by-step
  walk-through and a small ASCII / Mermaid diagram.
- Always cite the relevant file paths in the "Where this lives in the
  codebase" section of each wiki page so the documentation can be
  audited against the source.
- If a user reports that the docs and the app disagree, treat it as a
  **bug** of the same severity as a broken feature.
