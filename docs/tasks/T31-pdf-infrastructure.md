# T31 — PDF infrastructure & summary / instructions pages

- **Milestone**: M8
- **Depends on**: T28, T30
- **Status**: todo

## Goal

Set up the PDF export pipeline with `pdf-lib`, build the PDF export dialog (plan §8.3 / §39), and implement the first two pages: Project Summary and Installation Instructions. Later tasks (T32, T33) implement the geometry-heavy pages.

## Files

```
src/domain/pdf/pdfDocument.ts
src/domain/pdf/fonts.ts
src/domain/pdf/layout.ts                          (page size, margins, scale helpers)
src/domain/pdf/text.ts                            (text shaping helpers)
src/domain/pdf/svg.ts                             (SVG → pdf-lib draw helpers)
src/domain/pdf/renderSummaryPage.ts
src/domain/pdf/renderInstructionsPage.ts
src/domain/pdf/index.ts
src/domain/pdf/__tests__/*.test.ts
src/features/exportPdf/PdfExportDialog.tsx
src/features/exportPdf/PdfPreview.tsx
src/features/exportPdf/useExportPdf.ts
```

## Dependencies

Already installed in T01: `pdf-lib`, `@pdf-lib/fontkit`. Add `public/fonts/Inter-Regular.ttf` and `Inter-Bold.ttf` to the repo (or use the embedded standard font `Helvetica` from `pdf-lib` to avoid bundling fonts). **Decision below** says use embedded standard fonts in MVP.

## `pdfDocument.ts`

```ts
export type PdfBuildInput = {
  project: Project;
  settings: PdfExportSettings;
  layouts: MaterialLayout[];
  cutList: MaterialCutListItem[];
  cuttingDiagrams: CuttingDiagram[];
  projectStats: ProjectStats;
};

export const buildPdfDocument = async (input: PdfBuildInput): Promise<Uint8Array>;
```

Steps:

1. Create `PDFDocument`.
2. Embed `Helvetica` and `Helvetica-Bold` (standard fonts; no external file).
3. Conditionally render pages based on `settings.include*` flags:
   - Always: Page 1 — Summary.
   - If `includeFinalAppearance`: Page 2 (T32).
   - If `includeTechnicalDrawing`: Page 3 (T32).
   - If `includeMaterialLayout`: Page 4 (T32).
   - If `includeCutList`: Page 5 (T33).
   - If `includeCuttingDiagrams`: Pages 6+ (T33).
   - If `includeInstallationInstructions`: Final page.
4. Return `await pdfDoc.save()`.

## `layout.ts`

```ts
export type PageContext = {
  page: PDFPage;
  doc: PDFDocument;
  fonts: { regular: PDFFont; bold: PDFFont };
  paper: { widthPt: number; heightPt: number };
  marginPt: number;
  contentBox: { x: number; y: number; w: number; h: number };
  scale: { mmPerPt: number; ptPerMm: number };
};
export const createPage = (doc: PDFDocument, settings: PdfExportSettings, fonts): PageContext;
export const drawHeader = (ctx: PageContext, title: string, subtitle?: string): number;  // returns new y cursor
export const drawFooter = (ctx: PageContext, project: Project, pageNumber: number): void;
```

- Paper sizes from `settings.paperSize` (A4 = 210 × 297 mm, A3 = 297 × 420 mm). Orientation swaps dims.
- Margin: 15 mm.
- Header: project name + page title; underline.
- Footer: project name | date | page N of M (M filled in a second pass via `setPageNumber` or via post-processing).

## `text.ts`

Helpers for drawing wrapped text and tables. Implement:

- `drawText(ctx, text, x, y, opts)` returning advance height.
- `drawWrappedText(ctx, text, box, opts)`.
- `drawTable(ctx, headers, rows, box, opts)` with simple column widths.

## `svg.ts`

Converts a list of geometry primitives into `pdf-lib` draw calls:

```ts
export type PdfDrawCmd =
  | { kind: 'line'; a: Point2D; b: Point2D; color: RGB; widthPt: number; dashed?: boolean }
  | { kind: 'polygon'; points: Point2D[]; fill?: RGB; fillOpacity01?: number; stroke?: RGB; strokeWidthPt?: number; closed: boolean }
  | { kind: 'text'; text: string; pos: Point2D; size: number; font: 'regular' | 'bold'; color: RGB }
  | { kind: 'rect'; pos: Point2D; w: number; h: number; fill?: RGB; stroke?: RGB; strokeWidthPt?: number };

export const drawWorldGeometry = (ctx: PageContext, cmds: PdfDrawCmd[], worldToPagePt: (p: Point2D) => Point2D): void;
```

This is the shared pipeline used by T32 to draw surfaces, openings, dimensions, material pieces, and overlap regions.

## `renderSummaryPage.ts`

Content (plan §38.1):

- Project name, date, units.
- Per material: name, unit size W × H × T, default joint, total full units, total cut pieces.
- Number of surfaces, total visible area, total purchased area, waste estimate.
- Number of warnings (counts by severity).

Render as a key/value list and a small table.

## `renderInstructionsPage.ts`

Content (plan §38.7): the boilerplate numbered list, plus any project-specific notes (overlap presence, material thickness, connection notes). If no overlaps exist, omit the related bullet.

## PDF Export Dialog

`PdfExportDialog` modal:

- Bound to `project.pdfSettings` (initial state).
- All fields from plan §8.3 (paper, orientation, scale, includes).
- "Preview" button → shows `PdfPreview` (renders the PDF to a blob URL and embeds in an `<iframe>`).
- "Export" button → builds PDF, triggers download with file name `${slug(project.name)}.pdf`.
- On confirm, persist the dialog's settings into the project via `updatePdfSettingsCommand` (new command in `pdfSettingsCommand.ts`).

`useExportPdf` hook handles the async pipeline and surfaces progress / errors.

## Implementation steps

1. Build `layout.ts`, `text.ts`, `svg.ts`, `fonts.ts`.
2. Build `pdfDocument.ts` with page selection logic.
3. Build `renderSummaryPage.ts` and `renderInstructionsPage.ts` with tests:
   - Assert the produced PDF parses back and contains the expected text strings (use `pdf-parse` in dev or scan bytes for a known phrase).
4. Build `PdfExportDialog` and `PdfPreview`.
5. Wire toolbar "Export PDF" button.

## Decisions

- **Standard fonts** (Helvetica) in MVP: avoids 200+ KB font bundling. Document this; T31+ can swap in Inter via fontkit later.
- **SVG-rendering layer** is internal-only: we don't produce SVG files; we use the SVG-like command list as an intermediate IR drawn into `pdf-lib`.
- **Page numbering**: render placeholder `Page X of Y`; after all pages built, do a second pass that re-draws the footer with actual counts.

## Open questions

_(none)_

## Acceptance criteria

- [ ] "Export PDF" produces a valid PDF that opens in standard viewers.
- [ ] Summary page contains required fields.
- [ ] Instructions page contains the boilerplate plus project-specific notes.
- [ ] Dialog persists user choices into `project.pdfSettings`.
- [ ] Preview button renders the PDF in an iframe.
- [ ] Tests pass.

## Verification

```
npm test -- src/domain/pdf
npm run dev   # manual export and visual check
```

## Progress Log

_(append entries here)_
