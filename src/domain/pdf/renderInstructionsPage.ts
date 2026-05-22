import type { PdfBuildContext } from './pdfDocument';
import { createPage, drawHeader } from './layout';
import { drawWrappedText } from './text';

export const renderInstructionsPage = (build: PdfBuildContext): void => {
  const ctx = createPage(build.doc, build.settings, build.fonts);
  build.contexts.push(ctx);
  let y = drawHeader(ctx, 'Installation Instructions', build.project.name);

  const lines: string[] = [
    '1. Verify all measurements on site before cutting any material.',
    '2. Lay out pieces dry before final fixing to confirm alignment.',
    '3. Cut pieces from the cutting diagrams; respect each piece code.',
    '4. Mind material thickness at corners and connections.',
  ];
  const hasOverlap = build.layouts.some((layout) =>
    layout.pieces.some((piece) => piece.overlapPolygons.length > 0),
  );
  if (hasOverlap) {
    lines.push(
      '5. Some pieces extend physically beyond a surface edge (overlap). The visible portion is on the target surface; the overlap portion wraps around or supports the connection.',
    );
  }
  for (const m of build.project.materials) {
    lines.push(`Material ${m.name}: ${m.unitWidthMm} \u00D7 ${m.unitHeightMm} \u00D7 ${m.thicknessMm} mm, joint ${m.defaultJointMm} mm.`);
  }
  for (const text of lines) {
    const used = drawWrappedText(ctx, text, { x: ctx.contentBox.x, y, w: ctx.contentBox.w });
    y -= used + 4;
  }
};
