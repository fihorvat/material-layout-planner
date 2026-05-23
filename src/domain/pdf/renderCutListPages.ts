import type { PdfBuildContext } from './pdfDocument';
import { createPage, drawHeader, PT_PER_MM } from './layout';
import { drawText } from './text';
import { rgb } from 'pdf-lib';
import type { PDFFont } from 'pdf-lib';

type CutListColumn = {
  title: string;
  widthRatio: number;
};

const CUT_LIST_COLUMNS: CutListColumn[] = [
  { title: 'Piece', widthRatio: 0.13 },
  { title: 'Surface', widthRatio: 0.17 },
  { title: 'Material', widthRatio: 0.12 },
  { title: 'Size (mm)', widthRatio: 0.12 },
  { title: 'Qty', widthRatio: 0.06 },
  { title: 'Thk', widthRatio: 0.06 },
  { title: 'Ovl', widthRatio: 0.05 },
  { title: 'Notes', widthRatio: 0.29 },
];

const CUT_LIST_FONT_SIZE = 7.5;
const CUT_LIST_LINE_HEIGHT = CUT_LIST_FONT_SIZE * 1.25;
const CUT_LIST_CELL_PAD = 2;

const wrapTableCell = (text: string, width: number, font: PDFFont, size: number): string[] => {
  if (!text) return [''];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const probe = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(probe, size) <= width) {
      line = probe;
      continue;
    }
    if (line) {
      lines.push(line);
      line = '';
    }
    let remaining = word;
    while (remaining.length > 0) {
      let slice = remaining;
      while (slice.length > 1 && font.widthOfTextAtSize(slice, size) > width) {
        slice = slice.slice(0, -1);
      }
      lines.push(slice);
      remaining = remaining.slice(slice.length);
    }
  }
  if (line) lines.push(line);
  return lines.length > 0 ? lines : [''];
};

const drawCutListHeaderRow = (
  ctx: ReturnType<typeof createPage>,
  yTop: number,
): { nextY: number; columnWidths: number[] } => {
  const columnWidths = CUT_LIST_COLUMNS.map((column) => ctx.contentBox.w * column.widthRatio);
  let x = ctx.contentBox.x;
  for (let index = 0; index < CUT_LIST_COLUMNS.length; index++) {
    const column = CUT_LIST_COLUMNS[index]!;
    const width = columnWidths[index]!;
    drawText(ctx, column.title, x + CUT_LIST_CELL_PAD, yTop - CUT_LIST_FONT_SIZE, {
      size: CUT_LIST_FONT_SIZE,
      font: 'bold',
    });
    x += width;
  }
  const ruleY = yTop - CUT_LIST_LINE_HEIGHT;
  ctx.page.drawLine({
    start: { x: ctx.contentBox.x, y: ruleY },
    end: { x: ctx.contentBox.x + ctx.contentBox.w, y: ruleY },
    thickness: 0.5,
    color: rgb(0.7, 0.7, 0.72),
  });
  return { nextY: ruleY - 4, columnWidths };
};

const drawCutListRow = (
  ctx: ReturnType<typeof createPage>,
  row: string[],
  columnWidths: number[],
  yTop: number,
): number => {
  const wrappedCells = row.map((cell, index) =>
    wrapTableCell(
      cell,
      columnWidths[index]! - CUT_LIST_CELL_PAD * 2,
      ctx.fonts.regular,
      CUT_LIST_FONT_SIZE,
    ),
  );
  const maxLines = wrappedCells.reduce((best, cellLines) => Math.max(best, cellLines.length), 1);
  const rowHeight = maxLines * CUT_LIST_LINE_HEIGHT + 4;
  let x = ctx.contentBox.x;
  for (let index = 0; index < wrappedCells.length; index++) {
    let lineY = yTop - CUT_LIST_FONT_SIZE;
    for (const line of wrappedCells[index]!) {
      drawText(ctx, line, x + CUT_LIST_CELL_PAD, lineY, { size: CUT_LIST_FONT_SIZE });
      lineY -= CUT_LIST_LINE_HEIGHT;
    }
    x += columnWidths[index]!;
  }
  const nextY = yTop - rowHeight;
  ctx.page.drawLine({
    start: { x: ctx.contentBox.x, y: nextY + 2 },
    end: { x: ctx.contentBox.x + ctx.contentBox.w, y: nextY + 2 },
    thickness: 0.3,
    color: rgb(0.84, 0.84, 0.86),
  });
  return nextY;
};

export const renderCutListPage = (build: PdfBuildContext): void => {
  if (build.cutList.length === 0) {
    const ctx = createPage(build.doc, build.settings, build.fonts);
    build.contexts.push(ctx);
    const y = drawHeader(ctx, 'Cut List', build.project.name);
    drawText(ctx, '(no pieces to cut)', ctx.contentBox.x, y);
    return;
  }
  const rows = build.cutList.map((it) => [
    it.pieceCodes.slice(0, 2).join(', ') +
      (it.pieceCodes.length > 2 ? ` +${it.pieceCodes.length - 2}` : ''),
    it.surfaceName,
    it.materialName,
    `${it.widthMm} \u00D7 ${it.heightMm}`,
    String(it.quantity),
    `${it.thicknessMm}`,
    it.overlapIncluded ? 'Y' : '-',
    it.notes.join('; '),
  ]);

  let pageIndex = 0;
  let rowIndex = 0;
  while (rowIndex < rows.length) {
    const ctx = createPage(build.doc, build.settings, build.fonts);
    build.contexts.push(ctx);
    const headerY = drawHeader(
      ctx,
      'Cut List',
      pageIndex === 0 ? build.project.name : `${build.project.name} · Continued`,
    );
    let { nextY, columnWidths } = drawCutListHeaderRow(ctx, headerY - 2);
    while (rowIndex < rows.length) {
      const row = rows[rowIndex]!;
      const probeHeight = row.reduce((best, cell, index) => {
        const lines = wrapTableCell(
          cell,
          columnWidths[index]! - CUT_LIST_CELL_PAD * 2,
          ctx.fonts.regular,
          CUT_LIST_FONT_SIZE,
        ).length;
        return Math.max(best, lines);
      }, 1);
      const rowHeight = probeHeight * CUT_LIST_LINE_HEIGHT + 4;
      if (nextY - rowHeight < ctx.marginPt + 12) break;
      nextY = drawCutListRow(ctx, row, columnWidths, nextY);
      rowIndex += 1;
    }
    pageIndex += 1;
  }
};

const INTER_SHEET_GAP_PT = 12;
const SHEET_LABEL_GAP_PT = 18;

type CuttingPageLayout = {
  scale: number;
  perRow: number;
  rowsPerPage: number;
};

const fitLabelSize = (
  font: PDFFont,
  text: string,
  availableWidthPt: number,
  preferredSizePt: number,
  minSizePt: number,
): number => {
  if (!text || availableWidthPt <= 0) return 0;
  const preferredWidth = font.widthOfTextAtSize(text, preferredSizePt);
  if (preferredWidth <= availableWidthPt) return preferredSizePt;
  const scaled = preferredSizePt * (availableWidthPt / preferredWidth);
  return scaled >= minSizePt ? scaled : 0;
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
    const rowsPerPage = Math.max(1, Math.floor((availableH + INTER_SHEET_GAP_PT) / rowStride));
    const totalRows = Math.ceil(unitCount / perRow);
    const pages = Math.ceil(totalRows / rowsPerPage);
    if (pages < bestPages || (pages === bestPages && best !== null && scale > best.scale)) {
      best = { scale, perRow, rowsPerPage };
      bestPages = pages;
    }
  }
  if (best === null) {
    const scale = Math.max(0.02, Math.min(availableW / ptW, availableH / ptH));
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
        const omittedPieceLabels: string[] = [];
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
          const inset = 1.5;
          const availableWidthPt = Math.max(0, pw - inset * 2);
          const availableHeightPt = Math.max(0, ph - inset * 2);
          const idText = piece.pieceCode;
          const dimText = `${Math.round(piece.widthMm)}×${Math.round(piece.heightMm)}`;
          const idSize = build.settings.includePieceIds
            ? fitLabelSize(ctx.fonts.regular, idText, availableWidthPt, 6, 2.8)
            : 0;
          const dimSize = build.settings.includePieceDimensions
            ? fitLabelSize(ctx.fonts.regular, dimText, availableWidthPt, 6, 2.8)
            : 0;
          let topCursor = py + ph - inset;
          let idRendered = false;
          if (build.settings.includePieceIds) {
            if (idSize > 0 && availableHeightPt >= idSize + 1) {
              drawText(ctx, idText, px + inset, topCursor - idSize, { size: idSize });
              topCursor -= idSize + 1;
              idRendered = true;
            }
          }
          if (build.settings.includePieceDimensions) {
            if (dimSize > 0 && availableHeightPt >= dimSize + 1) {
              const dimW = ctx.fonts.regular.widthOfTextAtSize(dimText, dimSize);
              const tx = px + Math.max(inset, (pw - dimW) / 2);
              const ty =
                topCursor - dimSize >= py + inset
                  ? topCursor - dimSize
                  : py + Math.max(inset, (ph - dimSize) / 2);
              drawText(ctx, dimText, tx, ty, {
                size: dimSize,
                color: rgb(0.2, 0.2, 0.25),
              });
            }
          }
          if (build.settings.includePieceIds && !idRendered) {
            omittedPieceLabels.push(`${idText} ${dimText}`);
          }
        }
        const caption =
          omittedPieceLabels.length > 0
            ? `#${unit.unitIndex + 1} · small: ${omittedPieceLabels.join(', ')}`
            : `#${unit.unitIndex + 1}`;
        drawText(ctx, caption, xCol, yRow - 10, { size: omittedPieceLabels.length > 0 ? 6.5 : 8 });

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
