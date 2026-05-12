# T32 — PDF technical drawing & material layout pages

- **Milestone**: M8
- **Depends on**: T31, T25
- **Status**: todo

## Goal

Render the three geometry-heavy PDF pages: Final Appearance, Technical Drawing, and Material Layout. They share a common world-to-page projection driven by `PdfExportSettings.scaleMode`.

## Files

```
src/domain/pdf/projection.ts
src/domain/pdf/renderFinalAppearancePage.ts
src/domain/pdf/renderTechnicalDrawingPage.ts
src/domain/pdf/renderMaterialLayoutPage.ts
src/domain/pdf/sceneBuilder.ts
src/domain/pdf/__tests__/projection.test.ts
```

## `projection.ts`

```ts
export type ProjectionInput = {
  worldAabb: Aabb;
  contentBoxPt: { w: number; h: number };
  scaleMode: 'auto' | 'fixed' | 'custom';
  fixedScale?: '1:5' | '1:10' | '1:20';
  customScale?: number;     // mm per pt? actually scale 1:N is N mm per pt? Document precisely.
};
export type Projection = {
  worldToPagePt: (p: Point2D) => Point2D;     // origin top-left of content box
  scaleMmPerPt: number;
  scaleLabel: string;                          // e.g., "1:10" or "Auto"
};
export const computeProjection = (input: ProjectionInput): Projection;
```

Scale convention (document in code):

- 1 pt = 1/72 inch = 0.3527 mm.
- A 1:10 scale means 10 mm of real world equals 1 mm on paper → 1 mm world = 0.1 mm paper = `0.1 / 0.3527 ≈ 0.2835` pt.
- `mmPerPt = 1 / (worldMmDrawnPerPaperMm * ptPerMm)` — derive carefully and unit-test.
- Auto: pick the largest standard scale (1:5, 1:10, 1:20, 1:50, 1:100, 1:200, 1:500) that fits the `worldAabb` within `contentBoxPt`. Padding 5 mm world.

## `sceneBuilder.ts`

```ts
export type SceneOpts = {
  showDimensions: boolean;
  showSurfaceNames: boolean;
  showPieceIds: boolean;
  showPieceDimensions: boolean;
  showOverlapZones: boolean;
};

export const buildAppearanceScene = (project: Project, opts: SceneOpts): PdfDrawCmd[];
export const buildTechnicalScene = (project: Project, opts: SceneOpts): PdfDrawCmd[];
export const buildLayoutScene = (project: Project, opts: SceneOpts): PdfDrawCmd[];
```

Each scene composer returns a list of `PdfDrawCmd` (T31's IR). The page renderer applies projection, draws header/footer, then draws scene commands via `drawWorldGeometry`.

## Final Appearance page (plan §38.2)

Scene contents:

- Surface fills using `material.style.fillColor` (or default).
- Pattern lines (joint lines): draw each material piece's bounding rectangle outline using `material.style.jointColor`.
- Surface names if `settings.includeSurfaceNames`.
- Piece IDs if `settings.includePieceIds` (light gray, small font).
- Overlap zones if `settings.includeOverlapZones` (semi-transparent fill).

## Technical Drawing page (plan §38.3)

Scene contents:

- Outer surface boundaries with strokes; holes as inner CW polygons.
- Dimension annotations from `project.dimensions`.
- Surface names.
- Connection chevrons / labels (small).
- Scale indicator (a 50 mm bar near bottom-left with label).
- Material thickness note at the top.

## Material Layout page (plan §38.4)

Scene contents:

- Surface outlines.
- Each material piece (visible polygon) filled with material color, joint-color stroke.
- Overlap polygons rendered semi-transparent.
- Piece IDs if requested; piece sizes if requested.
- Pattern origin marker per surface (small crosshair labelled with `Offset X / Y`).
- Symmetry axis dashed line per surface if `pattern.symmetryMode !== 'none'`.

## Multi-page strategy

If a scene's bounding box does not fit the chosen scale, split across multiple pages by tiling: divide the world AABB into a grid of (page-content-size × scale) tiles with 10 mm overlap; render each tile as a separate page with a header showing "Sheet i/j".

Document the tiling rule in `projection.ts`.

## Implementation steps

1. Build `projection.ts` + thorough tests:
   - Auto picks the right standard scale for known AABB / paper.
   - Fixed `1:10` produces expected `mmPerPt`.
2. Build `sceneBuilder.ts`. For now each function is straightforward iteration over project data; reuse helpers where possible.
3. Build the three page renderers, wiring header/footer from T31's `layout.ts`.
4. Tests:
   - PDF byte stream contains the surface name text.
   - PDF page count matches selected `include*` flags.

## Decisions

- **Tiling instead of distortion**: never stretch geometry to fit; always honor scale and split pages.
- **Dimension text size**: 8 pt regardless of scale; convert text positions through projection but keep text size constant.
- **Color management**: use sRGB; pdf-lib's `rgb(r,g,b)` with components 0..1.

## Open questions

_(none)_

## Acceptance criteria

- [ ] Three pages render with correct content.
- [ ] Scale indicator accurate (measure in viewer = 50 mm at chosen scale).
- [ ] Multi-page tiling works for projects exceeding the chosen scale.
- [ ] Overlap zones visible and semi-transparent.
- [ ] Tests pass.

## Verification

```
npm test -- src/domain/pdf
npm run dev   # export a project with a couple of surfaces, inspect each page
```

## Progress Log

_(append entries here)_
