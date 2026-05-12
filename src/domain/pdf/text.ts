import { rgb } from 'pdf-lib';
import type { RGB } from 'pdf-lib';
import type { PageContext } from './layout';

export type DrawTextOpts = {
  size?: number;
  font?: 'regular' | 'bold';
  color?: RGB;
};

export const drawText = (
  ctx: PageContext,
  text: string,
  x: number,
  y: number,
  opts: DrawTextOpts = {},
): number => {
  const size = opts.size ?? 10;
  const font = opts.font === 'bold' ? ctx.fonts.bold : ctx.fonts.regular;
  ctx.page.drawText(text, {
    x,
    y,
    size,
    font,
    color: opts.color ?? rgb(0.1, 0.1, 0.12),
  });
  return size * 1.25;
};

export const drawWrappedText = (
  ctx: PageContext,
  text: string,
  box: { x: number; y: number; w: number },
  opts: DrawTextOpts = {},
): number => {
  const size = opts.size ?? 10;
  const font = opts.font === 'bold' ? ctx.fonts.bold : ctx.fonts.regular;
  const words = text.split(/\s+/);
  let line = '';
  let yCursor = box.y;
  const lineHeight = size * 1.3;
  for (const word of words) {
    const probe = line.length ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(probe, size) > box.w) {
      drawText(ctx, line, box.x, yCursor, opts);
      yCursor -= lineHeight;
      line = word;
    } else {
      line = probe;
    }
  }
  if (line.length > 0) {
    drawText(ctx, line, box.x, yCursor, opts);
    yCursor -= lineHeight;
  }
  return box.y - yCursor;
};

export type TableCell = string;

export const drawTable = (
  ctx: PageContext,
  headers: TableCell[],
  rows: TableCell[][],
  box: { x: number; y: number; w: number },
  opts: { rowHeightPt?: number; fontSize?: number } = {},
): number => {
  const colCount = headers.length;
  if (colCount === 0) return 0;
  const colW = box.w / colCount;
  const size = opts.fontSize ?? 9;
  const rowH = opts.rowHeightPt ?? size * 1.6;
  let y = box.y;
  for (let c = 0; c < colCount; c++) {
    drawText(ctx, headers[c]!, box.x + c * colW, y, { size, font: 'bold' });
  }
  y -= rowH;
  ctx.page.drawLine({
    start: { x: box.x, y: y + rowH - 2 },
    end: { x: box.x + box.w, y: y + rowH - 2 },
    thickness: 0.4,
    color: rgb(0.7, 0.7, 0.7),
  });
  for (const row of rows) {
    for (let c = 0; c < colCount; c++) {
      drawText(ctx, row[c] ?? '', box.x + c * colW, y, { size });
    }
    y -= rowH;
  }
  return box.y - y;
};
