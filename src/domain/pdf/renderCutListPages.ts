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

const INTER_SHEET_GAP_PT = 12;
const SHEET_LABEL_GAP_PT = 14;

type CuttingPageLayout = {
  scale: number;
  perRow: number;
  rowsPerPage: number;
};

// Pick a sheets-per-row / scale combo that minimises total pages, breaking
// ties by larger scale (more legible). Gap widths are constants in page
// points and are NOT scaled with the sheets — that subtlety is what made the
// earlier version overflow the page.
const computeCuttingLayout = (
  materialWidthMm: number,
  materialHeightMm: number,
  unitCount: number,
  availableW: number,
  availableH: number,
): CuttingPageLayout => {
  const ptW = materialWidthMm * PT_PER_MM;
  const ptH = materialHeightMm * PT_PER_MM;
  const rowExtra = SHEET_LABEL_GAP_PT + INTER_SHEET_GAP_PT;

  let best: CuttingPageLayout | null = null;
  let bestPages = Number.POSITIVE_INFINITY;
  const maxPerRow = Math.max(1, Math.min(unitCount, 8));
  for (let perRow = 1; perRow <= maxPerRow; perRow++) {
    const horizSlack = availableW - (perRow - 1) * INTER_SHEET_GAP_PT;
    if (horizSlack <= 0) continue;
    const scaleHoriz = horizSlack / (perRow * ptW);
    const scaleVertSingle = (availableH - SHEET_LABEL_GAP_PT) / ptH;
    if (scaleVertSingle <= 0) continue;
    const scale = Math.min(scaleHoriz, scaleVertSingle);
    if (scale <= 0) continue;
    const sheetHpt = ptH * scale;
    const rowStride = sheetHpt + rowExtra;
    const rowsPerPage = Math.max(
      1,
      Math.floor((availableH + INTER_SHEET_GAP_PT) / rowStride),
    );
    const totalRows = Math.ceil(unitCount / perRow);
    const pages = Math.ceil(totalRows / rowsPerPage);
    if (
      pages < bestPages ||
      (pages === bestPages && best !== null && scale > best.scale)
    ) {
      best = { scale, perRow, rowsPerPage };
      bestPages = pages;
    }
  }
  if (best === null) {
    const scale = Math.max(
      0.02,
      Math.min(availableW / ptW, availableH / ptH),
    );
    best = { scale, perRow: 1, rowsPerPage: 1 };
  }
  return best;
};

const drawCuttingDiagramHeader = (
  build: PdfBuildContext,
  ctx: ReturnType<typeof createPage>,
  diagram: PdfBuildContext['cuttingDiagrams'][number],
  materialName: string,
  showSummary: boolean,
): number => {
  const title = `Cutting Diagram — ${materialName}`;
  let y = drawHeader(ctx, title, build.project.name);
  if (showSummary) {
    drawText(
      ctx,
      `Units: ${diagram.units.length} | Utilization: ${diagram.utilizationPercent.toFixed(1)}%`,
      ctx.contentBox.x,
      y,
    );
    y -= 18;
  } else {
    y -= 6;
  }
  return y;
};

export const renderCuttingDiagramPages = (build: PdfBuildContext): void => {
  for (const diagram of build.cuttingDiagrams) {
    const material = build.project.materials.find((m) => m.id === diagram.materialId);
    if (!material || diagram.units.length === 0) continue;

    let layout: CuttingPageLayout | null = null;
    let sheetW = 0;
    let sheetH = 0;
    let unitIdx = 0;
    let pageIndex = 0;
    while (unitIdx < diagram.units.length) {
      const ctx = createPage(build.doc, build.settings, build.fonts);
      build.contexts.push(ctx);
      const y = drawCuttingDiagramHeader(build, ctx, diagram, material.name, pageIndex === 0);

      // Lock the layout to the first page so all pages of this diagram share
      // the same scale (visually consistent across pages).
      if (layout === null) {
        const availableW = ctx.contentBox.w;
        const availableH = y - ctx.contentBox.y - 6;
        layout = computeCuttingLayout(
          material.unitWidthMm,
          material.unitHeightMm,
          diagram.units.length,
          availableW,
          availableH,
        );
        sheetW = material.unitWidthMm * PT_PER_MM * layout.scale;
        sheetH = material.unitHeightMm * PT_PER_MM * layout.scale;
      }
      const { scale, perRow, rowsPerPage } = layout;

      let xCol = ctx.contentBox.x;
      let yRow = y - sheetH;
      let rowsDrawn = 0;
      let colsInRow = 0;

      while (unitIdx < diagram.units.length && rowsDrawn < rowsPerPage) {
        const unit = diagram.units[unitIdx]!;
        ctx.page.drawRectangle({
          x: xCol,
          y: yRow,
          width: sheetW,
          height: sheetH,
          borderColor: rgb(0.3, 0.3, 0.35),
          borderWidth: 0.5,
        });
        for (const piece of unit.pieces) {
          const px = xCol + piece.xMm * PT_PER_MM * scale;
          const py = yRow + sheetH - (piece.yMm + piece.heightMm) * PT_PER_MM * scale;
          const pw = piece.widthMm * PT_PER_MM * scale;
          const ph = piece.heightMm * PT_PER_MM * scale;
          ctx.page.drawRectangle({
            x: px,
            y: py,
            width: pw,
            height: ph,
            color: rgb(0.85, 0.78, 0.65),
            borderColor: rgb(0.45, 0.42, 0.35),
            borderWidth: 0.3,
          });
          const idSize = 6;
          const dimSize = 6;
          let labelY = py + ph - idSize - 2;
          if (build.settings.includePieceIds) {
            const idText = piece.pieceCode;
            const idW = ctx.fonts.regular.widthOfTextAtSize(idText, idSize);
            if (pw > idW + 2 && ph > idSize + 2) {
              drawText(ctx, idText, px + 2, labelY, { size: idSize });
              labelY -= idSize + 1;
            }
          }
          if (build.settings.includePieceDimensions) {
            const dimText = `${Math.round(piece.widthMm)}×${Math.round(piece.heightMm)}`;
            const dimW = ctx.fonts.regular.widthOfTextAtSize(dimText, dimSize);
            if (pw > dimW + 2 && ph > dimSize + 2) {
              const tx = px + (pw - dimW) / 2;
              const ty = py + (ph - dimSize) / 2;
              drawText(ctx, dimText, tx, ty, {
                size: dimSize,
                color: rgb(0.2, 0.2, 0.25),
              });
            }
          }
        }
        drawText(ctx, `#${unit.unitIndex + 1}`, xCol, yRow - 10, { size: 8 });

        unitIdx += 1;
        colsInRow += 1;
        if (colsInRow >= perRow) {
          colsInRow = 0;
          rowsDrawn += 1;
          xCol = ctx.contentBox.x;
          yRow -= sheetH + SHEET_LABEL_GAP_PT + INTER_SHEET_GAP_PT;
        } else {
          xCol += sheetW + INTER_SHEET_GAP_PT;
        }
      }
      pageIndex += 1;
    }
  }
};
