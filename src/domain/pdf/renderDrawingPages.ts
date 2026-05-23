import type { Point2D } from '@/types';
import type { PdfBuildContext } from './pdfDocument';
import { createPage, drawHeader, PT_PER_MM } from './layout';
import { drawText } from './text';
import { drawWorldGeometry, type PdfDrawCmd } from './svg';
import { rgb } from 'pdf-lib';
import type { RGB } from 'pdf-lib';
import { pointsToAabb } from '@/domain/geometry';

type Bounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

const DEFAULT_BOUNDS: Bounds = { minX: 0, minY: 0, maxX: 1000, maxY: 1000 };
const THUMBNAIL_ASPECT_RATIO = 4 / 3;
const THUMBNAIL_BACKGROUND = '#f6f3eb';
const THUMBNAIL_BORDER = '#ddd2bf';
const THUMBNAIL_PADDING_PT = 18;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const expandBounds = (bounds: Bounds, paddingMm: number): Bounds => ({
  minX: bounds.minX - paddingMm,
  minY: bounds.minY - paddingMm,
  maxX: bounds.maxX + paddingMm,
  maxY: bounds.maxY + paddingMm,
});

const hexToRgb = (value: string, fallback: RGB): RGB => {
  const normalized = value.trim().replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return fallback;
  const r = Number.parseInt(normalized.slice(0, 2), 16) / 255;
  const g = Number.parseInt(normalized.slice(2, 4), 16) / 255;
  const b = Number.parseInt(normalized.slice(4, 6), 16) / 255;
  return rgb(r, g, b);
};

const boundsForPointSets = (pointSets: Point2D[][]): Bounds => {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  let found = false;
  for (const points of pointSets) {
    if (points.length === 0) continue;
    const b = pointsToAabb(points);
    if (b.minX < minX) minX = b.minX;
    if (b.minY < minY) minY = b.minY;
    if (b.maxX > maxX) maxX = b.maxX;
    if (b.maxY > maxY) maxY = b.maxY;
    found = true;
  }
  if (!found) return DEFAULT_BOUNDS;
  return { minX, minY, maxX, maxY };
};

const makeWorldToPagePt = (ctx: ReturnType<typeof createPage>, aabb: Bounds) => {
  const widthMm = aabb.maxX - aabb.minX || 1;
  const heightMm = aabb.maxY - aabb.minY || 1;
  const drawableWidthPt = Math.max(ctx.contentBox.w - 16, 1);
  const drawableHeightPt = Math.max(ctx.contentBox.h - 56, 1);
  const fit = Math.min(
    drawableWidthPt / (widthMm * PT_PER_MM),
    drawableHeightPt / (heightMm * PT_PER_MM),
  );
  const scale = Math.max(fit * 0.96, 0.001);
  const usedWidthPt = widthMm * PT_PER_MM * scale;
  const usedHeightPt = heightMm * PT_PER_MM * scale;
  const baseX = ctx.contentBox.x + (ctx.contentBox.w - usedWidthPt) / 2;
  const topY = ctx.paper.heightPt - ctx.marginPt - 60;
  const baseTopY = topY - Math.max(0, (drawableHeightPt - usedHeightPt) / 2);
  return (p: Point2D) => ({
    x: baseX + (p.x - aabb.minX) * PT_PER_MM * scale,
    y: baseTopY - (p.y - aabb.minY) * PT_PER_MM * scale,
  });
};

const makeWorldToFramePt = (
  aabb: Bounds,
  frame: { x: number; y: number; w: number; h: number },
  paddingPt: number,
) => {
  const widthMm = aabb.maxX - aabb.minX || 1;
  const heightMm = aabb.maxY - aabb.minY || 1;
  const drawableWidthPt = Math.max(frame.w - paddingPt * 2, 1);
  const drawableHeightPt = Math.max(frame.h - paddingPt * 2, 1);
  const fit = Math.min(
    drawableWidthPt / (widthMm * PT_PER_MM),
    drawableHeightPt / (heightMm * PT_PER_MM),
  );
  const scale = Math.max(fit * 0.96, 0.001);
  const usedWidthPt = widthMm * PT_PER_MM * scale;
  const usedHeightPt = heightMm * PT_PER_MM * scale;
  const baseX = frame.x + (frame.w - usedWidthPt) / 2;
  const baseTopY = frame.y + frame.h - (frame.h - usedHeightPt) / 2;
  return (p: Point2D) => ({
    x: baseX + (p.x - aabb.minX) * PT_PER_MM * scale,
    y: baseTopY - (p.y - aabb.minY) * PT_PER_MM * scale,
  });
};

const thumbnailFrame = (
  ctx: ReturnType<typeof createPage>,
  topY: number,
): { x: number; y: number; w: number; h: number } => {
  const availableTop = topY - 8;
  const availableBottom = ctx.contentBox.y + 12;
  const availableHeight = Math.max(1, availableTop - availableBottom);
  const availableWidth = Math.max(1, ctx.contentBox.w - 8);
  let width = Math.min(availableWidth, availableHeight * THUMBNAIL_ASPECT_RATIO);
  let height = width / THUMBNAIL_ASPECT_RATIO;
  if (height > availableHeight) {
    height = availableHeight;
    width = height * THUMBNAIL_ASPECT_RATIO;
  }
  return {
    x: ctx.contentBox.x + (ctx.contentBox.w - width) / 2,
    y: availableBottom + (availableHeight - height) / 2,
    w: width,
    h: height,
  };
};

const projectOverviewBounds = (build: PdfBuildContext): Bounds =>
  boundsForPointSets([
    ...build.project.surfaces.flatMap((surface) => [surface.outerBoundary, ...surface.holes]),
    ...build.layouts.flatMap((layout) =>
      layout.pieces.flatMap((piece) => [
        piece.visiblePolygon,
        piece.physicalPolygon,
        ...piece.overlapPolygons,
      ]),
    ),
    ...build.project.drawingEntities.flatMap((entity) => {
      if (entity.type === 'line') return [[entity.start, entity.end]];
      if (entity.type === 'rectangle') {
        const x0 = entity.origin.x;
        const y0 = entity.origin.y;
        return [
          [
            { x: x0, y: y0 },
            { x: x0 + entity.widthMm, y: y0 },
            { x: x0 + entity.widthMm, y: y0 + entity.heightMm },
            { x: x0, y: y0 + entity.heightMm },
          ],
        ];
      }
      return [entity.points];
    }),
    ...build.project.labels
      .filter((label) => label.anchorType === 'free')
      .map((label) => [label.position]),
  ]);

const projectedBounds = (
  points: Point2D[],
  toPt: (point: Point2D) => Point2D,
): { minX: number; minY: number; maxX: number; maxY: number } => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const point of points) {
    const projected = toPt(point);
    if (projected.x < minX) minX = projected.x;
    if (projected.y < minY) minY = projected.y;
    if (projected.x > maxX) maxX = projected.x;
    if (projected.y > maxY) maxY = projected.y;
  }
  return { minX, minY, maxX, maxY };
};

const fitPdfLabelSize = (
  measureTextWidth: (size: number) => number,
  availableWidthPt: number,
  preferredSizePt: number,
  minSizePt: number,
): number => {
  if (availableWidthPt <= 0) return 0;
  const preferredWidth = measureTextWidth(preferredSizePt);
  if (preferredWidth <= availableWidthPt) return preferredSizePt;
  const scaled = preferredSizePt * (availableWidthPt / preferredWidth);
  return scaled >= minSizePt ? scaled : 0;
};

const drawMaterialPieceLabel = (
  ctx: ReturnType<typeof createPage>,
  toPt: (point: Point2D) => Point2D,
  piece: PdfBuildContext['layouts'][number]['pieces'][number],
  settings: PdfBuildContext['settings'],
): void => {
  const bounds = projectedBounds(piece.visiblePolygon, toPt);
  const availableWidthPt = Math.max(0, bounds.maxX - bounds.minX - 6);
  const availableHeightPt = Math.max(0, bounds.maxY - bounds.minY - 6);
  if (availableWidthPt <= 0 || availableHeightPt <= 0) return;

  const idText = piece.pieceCode;
  const dimText = `${Math.round(piece.boundingWidthMm)}×${Math.round(piece.boundingHeightMm)}`;
  const preferredIdSize = 6;
  const preferredDimSize = 5.5;
  const idSize = settings.includePieceIds
    ? fitPdfLabelSize(
        (size) => ctx.fonts.regular.widthOfTextAtSize(idText, size),
        availableWidthPt,
        preferredIdSize,
        4,
      )
    : 0;
  const dimSize = settings.includePieceDimensions
    ? fitPdfLabelSize(
        (size) => ctx.fonts.regular.widthOfTextAtSize(dimText, size),
        availableWidthPt,
        preferredDimSize,
        3.5,
      )
    : 0;

  const lineGap = 2;
  const requiredHeight =
    (idSize > 0 ? idSize : 0) + (dimSize > 0 ? (idSize > 0 ? lineGap : 0) + dimSize : 0);
  const showBoth = idSize > 0 && dimSize > 0 && requiredHeight <= availableHeightPt;
  const showIdOnly = idSize > 0 && (!showBoth || dimSize === 0) && idSize <= availableHeightPt;
  const showDimOnly = !showBoth && !showIdOnly && dimSize > 0 && dimSize <= availableHeightPt;
  if (!showBoth && !showIdOnly && !showDimOnly) return;

  const center = toPt(piece.labelPosition);
  let currentY = center.y + requiredHeight / 2;
  if (showBoth) {
    const idWidth = ctx.fonts.regular.widthOfTextAtSize(idText, idSize);
    drawText(ctx, idText, center.x - idWidth / 2, currentY - idSize, {
      size: idSize,
      color: rgb(0.15, 0.15, 0.2),
    });
    currentY -= idSize + lineGap;
    const dimWidth = ctx.fonts.regular.widthOfTextAtSize(dimText, dimSize);
    drawText(ctx, dimText, center.x - dimWidth / 2, currentY - dimSize, {
      size: dimSize,
      color: rgb(0.25, 0.25, 0.3),
    });
    return;
  }
  if (showIdOnly) {
    const idWidth = ctx.fonts.regular.widthOfTextAtSize(idText, idSize);
    drawText(ctx, idText, center.x - idWidth / 2, center.y - idSize / 2, {
      size: idSize,
      color: rgb(0.15, 0.15, 0.2),
    });
    return;
  }
  if (showDimOnly) {
    const dimWidth = ctx.fonts.regular.widthOfTextAtSize(dimText, dimSize);
    drawText(ctx, dimText, center.x - dimWidth / 2, center.y - dimSize / 2, {
      size: dimSize,
      color: rgb(0.25, 0.25, 0.3),
    });
  }
};

const materialLayoutBounds = (
  surface: PdfBuildContext['project']['surfaces'][number],
  layouts: PdfBuildContext['layouts'],
): Bounds =>
  boundsForPointSets([
    surface.outerBoundary,
    ...surface.holes,
    ...layouts.flatMap((layout) =>
      layout.pieces.flatMap((piece) => [piece.physicalPolygon, ...piece.overlapPolygons]),
    ),
  ]);

const pushSurfaceOutline = (
  cmds: PdfDrawCmd[],
  surface: PdfBuildContext['project']['surfaces'][number],
  color: RGB,
  strokeWidthPt: number,
): void => {
  cmds.push({
    kind: 'polygon',
    points: surface.outerBoundary,
    closed: true,
    stroke: color,
    strokeWidthPt,
  });
  for (const hole of surface.holes) {
    cmds.push({
      kind: 'polygon',
      points: hole,
      closed: true,
      stroke: color,
      strokeWidthPt: Math.max(0.4, strokeWidthPt - 0.15),
    });
  }
};

const pushOverviewDrawingEntities = (build: PdfBuildContext, cmds: PdfDrawCmd[]): void => {
  for (const entity of build.project.drawingEntities) {
    const color = hexToRgb(entity.style.strokeColor, rgb(0.18, 0.2, 0.24));
    const width = clamp(entity.style.strokeWidthPx * 0.6, 0.4, 1.2);
    if (entity.type === 'line') {
      cmds.push({ kind: 'line', a: entity.start, b: entity.end, color, widthPt: width });
      continue;
    }
    if (entity.type === 'rectangle') {
      const x0 = entity.origin.x;
      const y0 = entity.origin.y;
      cmds.push({
        kind: 'polygon',
        points: [
          { x: x0, y: y0 },
          { x: x0 + entity.widthMm, y: y0 },
          { x: x0 + entity.widthMm, y: y0 + entity.heightMm },
          { x: x0, y: y0 + entity.heightMm },
        ],
        closed: true,
        stroke: color,
        strokeWidthPt: width,
      });
      continue;
    }
    cmds.push({
      kind: 'polygon',
      points: entity.points,
      closed: true,
      stroke: color,
      strokeWidthPt: width,
    });
  }
};

const pushOverviewLabels = (build: PdfBuildContext, cmds: PdfDrawCmd[]): void => {
  for (const label of build.project.labels) {
    if (label.anchorType !== 'free') continue;
    cmds.push({
      kind: 'text',
      text: label.style.uppercase ? label.text.toUpperCase() : label.text,
      pos: label.position,
      size: clamp(label.style.fontSizePx / 8, 8, 18),
      font: label.style.bold ? 'bold' : 'regular',
      color: hexToRgb(label.style.textColor, rgb(0.1, 0.1, 0.16)),
    });
  }
};

const pushEdgeDimensionLabels = (cmds: PdfDrawCmd[], ring: Point2D[], color: RGB): void => {
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
  if (build.project.surfaces.length === 0) return;
  for (const surface of build.project.surfaces) {
    const ctx = createPage(build.doc, build.settings, build.fonts);
    build.contexts.push(ctx);
    drawHeader(ctx, 'Technical Drawing', `${build.project.name} · ${surface.name}`);
    const toPt = makeWorldToPagePt(
      ctx,
      expandBounds(
        boundsForPointSets([surface.outerBoundary, ...surface.holes]),
        build.settings.includeDimensions ? 36 : 18,
      ),
    );
    const cmds: PdfDrawCmd[] = [];
    pushSurfaceOutline(cmds, surface, rgb(0.1, 0.1, 0.15), 0.75);
    if (build.settings.includeDimensions) {
      pushEdgeDimensionLabels(cmds, surface.outerBoundary, rgb(0.15, 0.15, 0.25));
    }
    for (const hole of surface.holes) {
      if (build.settings.includeDimensions) {
        pushEdgeDimensionLabels(cmds, hole, rgb(0.35, 0.35, 0.4));
      }
    }
    drawWorldGeometry(ctx, cmds, toPt);
  }
};

export const renderMaterialLayoutPage = (build: PdfBuildContext): void => {
  if (build.layouts.length === 0) return;
  for (const surface of build.project.surfaces) {
    const surfaceLayouts = build.layouts.filter((layout) => layout.surfaceId === surface.id);
    if (surfaceLayouts.length === 0) continue;

    const ctx = createPage(build.doc, build.settings, build.fonts);
    build.contexts.push(ctx);
    drawHeader(ctx, 'Material Layout', `${build.project.name} · ${surface.name}`);
    const toPt = makeWorldToPagePt(
      ctx,
      expandBounds(materialLayoutBounds(surface, surfaceLayouts), 18),
    );
    const cmds: PdfDrawCmd[] = [];
    pushSurfaceOutline(cmds, surface, rgb(0.16, 0.18, 0.22), 0.75);
    for (const layout of surfaceLayouts) {
      const material = build.project.materials.find((m) => m.id === layout.materialId);
      if (!material) continue;
      const fillColor = hexToRgb(material.style.fillColor, rgb(0.85, 0.78, 0.65));
      const strokeColor = hexToRgb(material.style.jointColor, rgb(0.45, 0.42, 0.35));
      for (const piece of layout.pieces) {
        cmds.push({
          kind: 'polygon',
          points: piece.visiblePolygon,
          closed: true,
          fill: fillColor,
        });
        if (build.settings.includeOverlapZones) {
          for (const [index, overlap] of piece.overlapPolygons.entries()) {
            cmds.push({
              kind: 'polygon',
              points: overlap,
              closed: true,
              fill: fillColor,
              fillOpacity01: piece.overlapPolygonOpacities?.[index] ?? 0.25,
              stroke: strokeColor,
              strokeWidthPt: 0.3,
            });
          }
        }
        cmds.push({
          kind: 'polygon',
          points: piece.physicalPolygon,
          closed: true,
          stroke: strokeColor,
          strokeWidthPt: 0.55,
        });
      }
    }
    drawWorldGeometry(ctx, cmds, toPt);

    for (const layout of surfaceLayouts) {
      for (const piece of layout.pieces) {
        drawMaterialPieceLabel(ctx, toPt, piece, build.settings);
      }
    }

    drawText(ctx, `${surfaceLayouts.length} layout(s)`, ctx.contentBox.x, ctx.marginPt + 14, {
      size: 8,
    });
  }
};

export const renderFinalAppearancePage = async (build: PdfBuildContext): Promise<void> => {
  if (build.project.surfaces.length === 0) return;

  const overviewBounds = expandBounds(projectOverviewBounds(build), 24);
  const orientation =
    overviewBounds.maxX - overviewBounds.minX > overviewBounds.maxY - overviewBounds.minY
      ? 'landscape'
      : 'portrait';
  const ctx = createPage(build.doc, build.settings, build.fonts, { orientation });
  build.contexts.push(ctx);
  const headerY = drawHeader(ctx, 'Project Overview', build.project.name);
  const frame = thumbnailFrame(ctx, headerY);
  ctx.page.drawRectangle({
    x: frame.x,
    y: frame.y,
    width: frame.w,
    height: frame.h,
    color: hexToRgb(THUMBNAIL_BACKGROUND, rgb(0.96, 0.95, 0.92)),
    borderColor: hexToRgb(THUMBNAIL_BORDER, rgb(0.86, 0.82, 0.75)),
    borderWidth: 0.8,
  });

  if (build.overviewThumbnail) {
    const image =
      build.overviewThumbnail.mimeType === 'image/png'
        ? await build.doc.embedPng(build.overviewThumbnail.bytes)
        : await build.doc.embedJpg(build.overviewThumbnail.bytes);
    const fitted = image.scaleToFit(frame.w - 2, frame.h - 2);
    ctx.page.drawImage(image, {
      x: frame.x + (frame.w - fitted.width) / 2,
      y: frame.y + (frame.h - fitted.height) / 2,
      width: fitted.width,
      height: fitted.height,
    });
    return;
  }

  const toPt = makeWorldToFramePt(overviewBounds, frame, THUMBNAIL_PADDING_PT);
  const cmds: PdfDrawCmd[] = [];

  for (const surface of build.project.surfaces) {
    cmds.push({
      kind: 'polygon',
      points: surface.outerBoundary,
      closed: true,
      fill: hexToRgb(surface.style.fillColor, rgb(0.9, 0.91, 0.92)),
      fillOpacity01: surface.style.fillOpacity,
      stroke: hexToRgb(surface.style.strokeColor, rgb(0.12, 0.14, 0.18)),
      strokeWidthPt: 0.45,
    });
    for (const hole of surface.holes) {
      cmds.push({
        kind: 'polygon',
        points: hole,
        closed: true,
        fill: hexToRgb(THUMBNAIL_BACKGROUND, rgb(0.96, 0.95, 0.92)),
        stroke: hexToRgb(surface.style.strokeColor, rgb(0.12, 0.14, 0.18)),
        strokeWidthPt: 0.35,
      });
    }
    pushSurfaceOutline(cmds, surface, rgb(0.12, 0.14, 0.18), 0.7);
  }
  for (const layout of build.layouts) {
    const material = build.project.materials.find((entry) => entry.id === layout.materialId);
    const fillColor = material
      ? hexToRgb(material.style.fillColor, rgb(0.85, 0.78, 0.65))
      : rgb(0.85, 0.78, 0.65);
    const strokeColor = material
      ? hexToRgb(material.style.jointColor, rgb(0.45, 0.42, 0.35))
      : rgb(0.45, 0.42, 0.35);
    for (const piece of layout.pieces) {
      cmds.push({
        kind: 'polygon',
        points: piece.visiblePolygon,
        closed: true,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidthPt: 0.35,
      });
      if (build.settings.includeOverlapZones) {
        for (const [index, overlap] of piece.overlapPolygons.entries()) {
          cmds.push({
            kind: 'polygon',
            points: overlap,
            closed: true,
            fill: fillColor,
            fillOpacity01: piece.overlapPolygonOpacities?.[index] ?? 0.25,
            stroke: strokeColor,
            strokeWidthPt: 0.3,
          });
        }
      }
    }
  }
  pushOverviewDrawingEntities(build, cmds);
  if (build.settings.includeSurfaceNames) {
    pushOverviewLabels(build, cmds);
  }

  drawWorldGeometry(ctx, cmds, toPt);
};
