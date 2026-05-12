import { rgb } from 'pdf-lib';
import type { RGB } from 'pdf-lib';
import type { Point2D } from '@/types';
import type { PageContext } from './layout';

export type PdfDrawCmd =
  | { kind: 'line'; a: Point2D; b: Point2D; color: RGB; widthPt: number; dashed?: boolean }
  | {
      kind: 'polygon';
      points: Point2D[];
      fill?: RGB;
      fillOpacity01?: number;
      stroke?: RGB;
      strokeWidthPt?: number;
      closed: boolean;
    }
  | { kind: 'text'; text: string; pos: Point2D; size: number; font: 'regular' | 'bold'; color: RGB }
  | { kind: 'rect'; pos: Point2D; w: number; h: number; fill?: RGB; stroke?: RGB; strokeWidthPt?: number };

export const drawWorldGeometry = (
  ctx: PageContext,
  cmds: PdfDrawCmd[],
  worldToPagePt: (p: Point2D) => Point2D,
): void => {
  for (const cmd of cmds) {
    if (cmd.kind === 'line') {
      const a = worldToPagePt(cmd.a);
      const b = worldToPagePt(cmd.b);
      ctx.page.drawLine({
        start: { x: a.x, y: a.y },
        end: { x: b.x, y: b.y },
        thickness: cmd.widthPt,
        color: cmd.color,
        dashArray: cmd.dashed ? [3, 3] : undefined,
      });
    } else if (cmd.kind === 'polygon') {
      const pts = cmd.points.map(worldToPagePt);
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i]!;
        const b = pts[(i + 1) % pts.length]!;
        if (!cmd.closed && i === pts.length - 1) break;
        ctx.page.drawLine({
          start: { x: a.x, y: a.y },
          end: { x: b.x, y: b.y },
          thickness: cmd.strokeWidthPt ?? 0.5,
          color: cmd.stroke ?? rgb(0.1, 0.1, 0.1),
        });
      }
    } else if (cmd.kind === 'text') {
      const pos = worldToPagePt(cmd.pos);
      const font = cmd.font === 'bold' ? ctx.fonts.bold : ctx.fonts.regular;
      ctx.page.drawText(cmd.text, {
        x: pos.x,
        y: pos.y,
        size: cmd.size,
        font,
        color: cmd.color,
      });
    } else if (cmd.kind === 'rect') {
      const pos = worldToPagePt(cmd.pos);
      ctx.page.drawRectangle({
        x: pos.x,
        y: pos.y,
        width: cmd.w,
        height: cmd.h,
        color: cmd.fill,
        borderColor: cmd.stroke,
        borderWidth: cmd.strokeWidthPt ?? 0,
      });
    }
  }
};
