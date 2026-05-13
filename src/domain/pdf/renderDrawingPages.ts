import type { Point2D } from '@/types';
import type { PdfBuildContext } from './pdfDocument';
import { createPage, drawHeader, PT_PER_MM } from './layout';
import { drawText } from './text';
import { drawWorldGeometry, type PdfDrawCmd } from './svg';
import { rgb } from 'pdf-lib';
import type { RGB } from 'pdf-lib';
import { pointsToAabb } from '@/domain/geometry';

const projectAabb = (project: PdfBuildContext['project']) => {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let found = false;
  for (const s of project.surfaces) {
    const b = pointsToAabb(s.outerBoundary);
    if (b.minX < minX) minX = b.minX;
    if (b.minY < minY) minY = b.minY;
    if (b.maxX > maxX) maxX = b.maxX;
    if (b.maxY > maxY) maxY = b.maxY;
    found = true;
  }
  if (!found) return { minX: 0, minY: 0, maxX: 1000, maxY: 1000 };
  return { minX, minY, maxX, maxY };
};

const makeWorldToPagePt = (build: PdfBuildContext, ctx: ReturnType<typeof createPage>) => {
  const aabb = projectAabb(build.project);
  const widthMm = aabb.maxX - aabb.minX || 1;
  const heightMm = aabb.maxY - aabb.minY || 1;
  const fit = Math.min(ctx.contentBox.w / (widthMm * PT_PER_MM), (ctx.contentBox.h - 40) / (heightMm * PT_PER_MM));
  const scale = Math.max(fit, 0.05);
  const baseX = ctx.contentBox.x + 6;
  const baseTopY = ctx.paper.heightPt - ctx.marginPt - 60;
  return (p: Point2D) => ({
    x: baseX + (p.x - aabb.minX) * PT_PER_MM * scale,
    y: baseTopY - (p.y - aabb.minY) * PT_PER_MM * scale,
  });
};

const pushEdgeDimensionLabels = (
  cmds: PdfDrawCmd[],
  ring: Point2D[],
  color: RGB,
): void => {
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]!;
    const b = ring[(i + 1) % ring.length]!;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lenMm = Math.hypot(dx, dy);
    if (lenMm < 1) continue;
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    // Offset the label slightly away from the edge along its normal.
    const nx = -dy / lenMm;
    const ny = dx / lenMm;
    const offsetMm = 20;
    cmds.push({
      kind: 'text',
      text: `${Math.round(lenMm)} mm`,
      pos: { x: mid.x + nx * offsetMm, y: mid.y + ny * offsetMm },
      size: 7,
      font: 'regular',
      color,
    });
  }
};

export const renderTechnicalDrawingPage = (build: PdfBuildContext): void => {
  const ctx = createPage(build.doc, build.settings, build.fonts);
  build.contexts.push(ctx);
  drawHeader(ctx, 'Technical Drawing', build.project.name);
  const toPt = makeWorldToPagePt(build, ctx);
  const cmds: PdfDrawCmd[] = [];
  for (const surface of build.project.surfaces) {
    cmds.push({
      kind: 'polygon',
      points: surface.outerBoundary,
      closed: true,
      stroke: rgb(0.1, 0.1, 0.15),
      strokeWidthPt: 0.75,
    });
    if (build.settings.includeDimensions) {
      pushEdgeDimensionLabels(cmds, surface.outerBoundary, rgb(0.15, 0.15, 0.25));
    }
    for (const hole of surface.holes) {
      cmds.push({
        kind: 'polygon',
        points: hole,
        closed: true,
        stroke: rgb(0.5, 0.5, 0.55),
        strokeWidthPt: 0.5,
      });
      if (build.settings.includeDimensions) {
        pushEdgeDimensionLabels(cmds, hole, rgb(0.35, 0.35, 0.4));
      }
    }
    if (build.settings.includeSurfaceNames) {
      cmds.push({
        kind: 'text',
        text: surface.name,
        pos: { x: surface.outerBoundary[0]!.x + 10, y: surface.outerBoundary[0]!.y + 12 },
        size: 9,
        font: 'bold',
        color: rgb(0.1, 0.1, 0.2),
      });
    }
  }
  drawWorldGeometry(ctx, cmds, toPt);
};

export const renderMaterialLayoutPage = (build: PdfBuildContext): void => {
  const ctx = createPage(build.doc, build.settings, build.fonts);
  build.contexts.push(ctx);
  drawHeader(ctx, 'Material Layout', build.project.name);
  const toPt = makeWorldToPagePt(build, ctx);
  const cmds: PdfDrawCmd[] = [];
  for (const layout of build.project.materialLayouts) {
    const material = build.project.materials.find((m) => m.id === layout.materialId);
    if (!material) continue;
    const fillColor = rgb(0.85, 0.78, 0.65);
    for (const piece of layout.pieces) {
      cmds.push({
        kind: 'polygon',
        points: piece.visiblePolygon,
        closed: true,
        stroke: rgb(0.45, 0.42, 0.35),
        strokeWidthPt: 0.4,
        fill: fillColor,
      });
      if (build.settings.includeOverlapZones) {
        for (const overlap of piece.overlapPolygons) {
          cmds.push({
            kind: 'polygon',
            points: overlap,
            closed: true,
            stroke: rgb(0.45, 0.42, 0.35),
            strokeWidthPt: 0.3,
          });
        }
      }
    }
  }
  drawWorldGeometry(ctx, cmds, toPt);

  // Draw piece labels in page-space so the offset between id and dimensions is
  // not shrunk by the world-to-page scale (which can collapse to a few points
  // for large projects and cause the two labels to overlap).
  const labelSize = 6;
  const labelLineHeightPt = labelSize + 2;
  for (const layout of build.project.materialLayouts) {
    const material = build.project.materials.find((m) => m.id === layout.materialId);
    if (!material) continue;
    for (const piece of layout.pieces) {
      const labelPt = toPt(piece.labelPosition);
      let lineY = labelPt.y;
      if (build.settings.includePieceIds) {
        drawText(ctx, piece.pieceCode, labelPt.x, lineY, {
          size: labelSize,
          color: rgb(0.15, 0.15, 0.2),
        });
        lineY -= labelLineHeightPt;
      }
      if (build.settings.includePieceDimensions) {
        const w = Math.round(piece.boundingWidthMm);
        const h = Math.round(piece.boundingHeightMm);
        drawText(ctx, `${w}×${h}`, labelPt.x, lineY, {
          size: labelSize,
          color: rgb(0.25, 0.25, 0.3),
        });
      }
    }
  }

  drawText(ctx, `${build.project.materialLayouts.length} layout(s)`, ctx.contentBox.x, ctx.marginPt + 14, { size: 8 });
};

export const renderFinalAppearancePage = (build: PdfBuildContext): void => {
  // For MVP, identical to material layout page, but without dimensions.
  renderMaterialLayoutPage(build);
};
