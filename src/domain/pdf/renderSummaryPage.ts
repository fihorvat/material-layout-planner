import type { PdfBuildContext } from './pdfDocument';
import { createPage, drawHeader } from './layout';
import { drawText, drawTable } from './text';
import { formatArea } from '@/domain/units';

export const renderSummaryPage = (build: PdfBuildContext): void => {
  const ctx = createPage(build.doc, build.settings, build.fonts);
  build.contexts.push(ctx);
  let y = drawHeader(ctx, 'Project Summary', build.project.name);
  const lineH = 14;
  drawText(ctx, `Units: ${build.project.unit}`, ctx.contentBox.x, y);
  y -= lineH;
  drawText(ctx, `Created: ${new Date(build.project.createdAt).toLocaleDateString()}`, ctx.contentBox.x, y);
  y -= lineH;
  drawText(ctx, `Surfaces: ${build.project.surfaces.length}`, ctx.contentBox.x, y);
  y -= lineH;
  drawText(ctx, `Materials: ${build.project.materials.length}`, ctx.contentBox.x, y);
  y -= lineH * 1.5;
  drawText(ctx, 'Statistics', ctx.contentBox.x, y, { font: 'bold' });
  y -= lineH;
  drawText(ctx, `Visible area: ${formatArea(build.projectStats.totalVisibleAreaMm2)}`, ctx.contentBox.x, y);
  y -= lineH;
  drawText(ctx, `Purchased area: ${formatArea(build.projectStats.totalPurchasedAreaMm2)}`, ctx.contentBox.x, y);
  y -= lineH;
  drawText(ctx, `Total waste: ${formatArea(build.projectStats.totalWasteAreaMm2)} (${build.projectStats.totalWastePercent.toFixed(1)} %)`, ctx.contentBox.x, y);
  y -= lineH * 2;
  drawText(ctx, 'Materials', ctx.contentBox.x, y, { font: 'bold' });
  y -= lineH;
  if (build.project.materials.length > 0) {
    const rows = build.project.materials.map((m) => [
      m.name,
      `${m.unitWidthMm} \u00D7 ${m.unitHeightMm} \u00D7 ${m.thicknessMm} mm`,
      `${m.defaultJointMm} mm`,
    ]);
    drawTable(ctx, ['Name', 'Unit size', 'Joint'], rows, { x: ctx.contentBox.x, y, w: ctx.contentBox.w });
  } else {
    drawText(ctx, '(no materials defined)', ctx.contentBox.x, y);
  }
};
