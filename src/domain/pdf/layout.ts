import type { PdfExportSettings } from '@/types';
import type { PDFDocument, PDFFont, PDFPage } from 'pdf-lib';
import { rgb } from 'pdf-lib';

export type Fonts = { regular: PDFFont; bold: PDFFont };

export type PageContext = {
  doc: PDFDocument;
  page: PDFPage;
  fonts: Fonts;
  paper: { widthPt: number; heightPt: number };
  marginPt: number;
  contentBox: { x: number; y: number; w: number; h: number };
  scale: { mmPerPt: number; ptPerMm: number };
};

const MM_PER_INCH = 25.4;
const PT_PER_INCH = 72;
export const PT_PER_MM = PT_PER_INCH / MM_PER_INCH;
const MM_PER_PT = MM_PER_INCH / PT_PER_INCH;

const PAPER_MM: Record<PdfExportSettings['paperSize'], { w: number; h: number }> = {
  A4: { w: 210, h: 297 },
  A3: { w: 297, h: 420 },
};

const MARGIN_MM = 15;

export const createPage = (doc: PDFDocument, settings: PdfExportSettings, fonts: Fonts): PageContext => {
  const paperMm = PAPER_MM[settings.paperSize];
  const widthMm = settings.orientation === 'landscape' ? paperMm.h : paperMm.w;
  const heightMm = settings.orientation === 'landscape' ? paperMm.w : paperMm.h;
  const widthPt = widthMm * PT_PER_MM;
  const heightPt = heightMm * PT_PER_MM;
  const page = doc.addPage([widthPt, heightPt]);
  const marginPt = MARGIN_MM * PT_PER_MM;
  return {
    doc,
    page,
    fonts,
    paper: { widthPt, heightPt },
    marginPt,
    contentBox: {
      x: marginPt,
      y: marginPt,
      w: widthPt - marginPt * 2,
      h: heightPt - marginPt * 2,
    },
    scale: { mmPerPt: MM_PER_PT, ptPerMm: PT_PER_MM },
  };
};

export const drawHeader = (ctx: PageContext, title: string, subtitle?: string): number => {
  const topY = ctx.paper.heightPt - ctx.marginPt;
  ctx.page.drawText(title, {
    x: ctx.contentBox.x,
    y: topY - 16,
    size: 16,
    font: ctx.fonts.bold,
    color: rgb(0.07, 0.09, 0.15),
  });
  let nextY = topY - 22;
  if (subtitle) {
    ctx.page.drawText(subtitle, {
      x: ctx.contentBox.x,
      y: topY - 32,
      size: 10,
      font: ctx.fonts.regular,
      color: rgb(0.3, 0.3, 0.3),
    });
    nextY = topY - 38;
  }
  ctx.page.drawLine({
    start: { x: ctx.contentBox.x, y: nextY - 4 },
    end: { x: ctx.contentBox.x + ctx.contentBox.w, y: nextY - 4 },
    thickness: 0.5,
    color: rgb(0.6, 0.65, 0.7),
  });
  return nextY - 14;
};

export const drawFooter = (ctx: PageContext, projectName: string, pageNumber: number, totalPages: number): void => {
  const y = ctx.marginPt - 6;
  const left = `${projectName}`;
  const right = `Page ${pageNumber} of ${totalPages}`;
  const date = new Date().toLocaleDateString();
  ctx.page.drawText(left, { x: ctx.contentBox.x, y, size: 8, font: ctx.fonts.regular, color: rgb(0.4, 0.4, 0.4) });
  ctx.page.drawText(date, {
    x: ctx.contentBox.x + ctx.contentBox.w / 2 - 20,
    y,
    size: 8,
    font: ctx.fonts.regular,
    color: rgb(0.4, 0.4, 0.4),
  });
  const rightWidth = ctx.fonts.regular.widthOfTextAtSize(right, 8);
  ctx.page.drawText(right, {
    x: ctx.contentBox.x + ctx.contentBox.w - rightWidth,
    y,
    size: 8,
    font: ctx.fonts.regular,
    color: rgb(0.4, 0.4, 0.4),
  });
};

