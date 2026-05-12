import type { PdfBuildContext } from './pdfDocument';
import { createPage, drawHeader, PT_PER_MM } from './layout';
import { drawTable, drawText } from './text';
import { rgb } from 'pdf-lib';

export const renderCutListPage = (build: PdfBuildContext): void => {
  const ctx = createPage(build.doc, build.settings, build.fonts);
  build.contexts.push(ctx);
  const y = drawHeader(ctx, 'Cut List', build.project.name);
  if (build.cutList.length === 0) {
    drawText(ctx, '(no pieces to cut)', ctx.contentBox.x, y);
    return;
  }
  const rows = build.cutList.map((it) => [
    it.pieceCodes.slice(0, 2).join(', ') + (it.pieceCodes.length > 2 ? ` +${it.pieceCodes.length - 2}` : ''),
    it.surfaceName,
    it.materialName,
    `${it.widthMm} \u00D7 ${it.heightMm}`,
    String(it.quantity),
    `${it.thicknessMm}`,
    it.overlapIncluded ? 'Y' : '-',
    it.notes.join('; '),
  ]);
  drawTable(
    ctx,
    ['Piece', 'Surface', 'Material', 'Size (mm)', 'Qty', 'Thk', 'Ovl', 'Notes'],
    rows,
    { x: ctx.contentBox.x, y, w: ctx.contentBox.w },
    { fontSize: 8 },
  );
};

export const renderCuttingDiagramPages = (build: PdfBuildContext): void => {
  for (const diagram of build.cuttingDiagrams) {
    const ctx = createPage(build.doc, build.settings, build.fonts);
    build.contexts.push(ctx);
    const material = build.project.materials.find((m) => m.id === diagram.materialId);
    const title = material ? `Cutting Diagram — ${material.name}` : 'Cutting Diagram';
    let y = drawHeader(ctx, title, build.project.name);
    drawText(ctx, `Units: ${diagram.units.length} | Utilization: ${diagram.utilizationPercent.toFixed(1)}%`, ctx.contentBox.x, y);
    y -= 18;
    if (!material) continue;
    const sheetW = material.unitWidthMm * PT_PER_MM;
    const sheetH = material.unitHeightMm * PT_PER_MM;
    const perRow = Math.max(1, Math.floor(ctx.contentBox.w / (sheetW + 12)));
    let x = ctx.contentBox.x;
    let yCursor = y - sheetH;
    let rowCount = 0;
    for (const unit of diagram.units) {
      ctx.page.drawRectangle({
        x,
        y: yCursor,
        width: sheetW,
        height: sheetH,
        borderColor: rgb(0.3, 0.3, 0.35),
        borderWidth: 0.5,
      });
      for (const piece of unit.pieces) {
        const px = x + piece.xMm * PT_PER_MM;
        const py = yCursor + sheetH - (piece.yMm + piece.heightMm) * PT_PER_MM;
        const pw = piece.widthMm * PT_PER_MM;
        const ph = piece.heightMm * PT_PER_MM;
        ctx.page.drawRectangle({
          x: px,
          y: py,
          width: pw,
          height: ph,
          color: rgb(0.85, 0.78, 0.65),
          borderColor: rgb(0.45, 0.42, 0.35),
          borderWidth: 0.3,
        });
        if (build.settings.includePieceIds) {
          drawText(ctx, piece.pieceCode, px + 2, py + ph - 8, { size: 6 });
        }
      }
      drawText(ctx, `#${unit.unitIndex + 1}`, x, yCursor - 10, { size: 8 });
      x += sheetW + 12;
      rowCount += 1;
      if (rowCount >= perRow) {
        rowCount = 0;
        x = ctx.contentBox.x;
        yCursor -= sheetH + 22;
      }
    }
  }
};
