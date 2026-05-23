import type Konva from 'konva';
import type { MaterialLayout, Project, Point2D } from '@/types';
import { useProjectStore, useEditorStore, getTheme, type Viewport, type Theme } from '@/state';
import { computeFitViewport, computeProjectContentBounds } from './fitToContent';
import { visibleWorldBounds } from './coords';
import { rectangleToPoints } from '@/domain/geometry';

let activeStage: Konva.Stage | null = null;
let stageCaptureQueue: Promise<void> = Promise.resolve();

export const setActiveStage = (stage: Konva.Stage | null): void => {
  activeStage = stage;
};

export const getActiveStage = (): Konva.Stage | null => activeStage;

export const serializeStageCapture = async <T>(operation: () => Promise<T>): Promise<T> => {
  const previous = stageCaptureQueue.catch(() => undefined);
  let release!: () => void;
  stageCaptureQueue = new Promise<void>((resolve) => {
    release = resolve;
  });
  await previous;
  try {
    return await operation();
  } finally {
    release();
  }
};

type StageThumbnailOptions = {
  targetWidth?: number;
  targetHeight?: number;
  mimeType?: 'image/png' | 'image/jpeg';
  quality?: number;
  paddingPx?: number;
  backgroundColor?: string;
  pixelRatio?: number;
};

type ThumbnailExportPlan = {
  width: number;
  height: number;
  viewport: Viewport | null;
};

const DEFAULT_THUMBNAIL_ASPECT_RATIO = 4 / 3;
const DEFAULT_THUMBNAIL_PADDING_PX = 24;
const DEFAULT_THUMBNAIL_BACKGROUND = '#f6f3eb';
const MAX_GRID_LINES_PER_AXIS = 400;

const GRID_COLORS: Record<Theme, { minor: string; major: string; axis: string }> = {
  light: { minor: '#e5e7eb', major: '#cbd5e1', axis: '#9ca3af' },
  dark: { minor: '#1f2a3d', major: '#334155', axis: '#64748b' },
};

type ThumbnailGridOptions = {
  viewport: Viewport;
  gridSizeMm: number;
  theme: Theme;
};

const waitForAnimationFrame = async (): Promise<void> => {
  await new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
};

const settleStageForCapture = async (stage: Konva.Stage): Promise<void> => {
  stage.batchDraw();
  await waitForAnimationFrame();
  stage.batchDraw();
  await waitForAnimationFrame();
};

export const computeThumbnailExportPlan = (
  project: Project,
  options: Pick<StageThumbnailOptions, 'targetWidth' | 'targetHeight' | 'paddingPx'> = {},
): ThumbnailExportPlan => {
  const width = Math.max(1, Math.round(options.targetWidth ?? 320));
  const height = Math.max(
    1,
    Math.round(options.targetHeight ?? width / DEFAULT_THUMBNAIL_ASPECT_RATIO),
  );
  const bounds = computeProjectContentBounds(project);
  return {
    width,
    height,
    viewport: bounds
      ? computeFitViewport(
          bounds,
          { width, height },
          options.paddingPx ?? DEFAULT_THUMBNAIL_PADDING_PX,
        )
      : null,
  };
};

const paintContainedCanvas = (
  source: HTMLCanvasElement,
  width: number,
  height: number,
  backgroundColor: string,
  grid?: ThumbnailGridOptions,
): HTMLCanvasElement => {
  const output = document.createElement('canvas');
  output.width = width;
  output.height = height;
  const ctx = output.getContext('2d');
  if (!ctx) return source;
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);
  const scale = Math.min(width / source.width, height / source.height);
  const drawWidth = source.width * scale;
  const drawHeight = source.height * scale;
  const dx = (width - drawWidth) / 2;
  const dy = (height - drawHeight) / 2;

  if (grid && grid.gridSizeMm > 0) {
    const outputViewport: Viewport = {
      scale: grid.viewport.scale * scale,
      offsetXPx: grid.viewport.offsetXPx * scale + dx,
      offsetYPx: grid.viewport.offsetYPx * scale + dy,
    };
    const bounds = visibleWorldBounds(outputViewport, width, height);
    const padding = grid.gridSizeMm * 5;
    const minX = Math.floor((bounds.minX - padding) / grid.gridSizeMm) * grid.gridSizeMm;
    const maxX = Math.ceil((bounds.maxX + padding) / grid.gridSizeMm) * grid.gridSizeMm;
    const minY = Math.floor((bounds.minY - padding) / grid.gridSizeMm) * grid.gridSizeMm;
    const maxY = Math.ceil((bounds.maxY + padding) / grid.gridSizeMm) * grid.gridSizeMm;
    const stepsX = Math.ceil((maxX - minX) / grid.gridSizeMm);
    const stepsY = Math.ceil((maxY - minY) / grid.gridSizeMm);
    const colors = GRID_COLORS[grid.theme];

    if (stepsX <= MAX_GRID_LINES_PER_AXIS && stepsY <= MAX_GRID_LINES_PER_AXIS) {
      const minorPx = grid.gridSizeMm * outputViewport.scale;
      const majorPx = minorPx * 5;
      const drawMinor = minorPx >= 4;
      const drawMajor = majorPx >= 4;
      const worldToOutput = (worldX: number, worldY: number) => ({
        x: worldX * outputViewport.scale + outputViewport.offsetXPx,
        y: worldY * outputViewport.scale + outputViewport.offsetYPx,
      });

      for (let i = 0; i <= stepsX; i++) {
        const x = minX + i * grid.gridSizeMm;
        const isMajor = Math.round(x / grid.gridSizeMm) % 5 === 0;
        if ((!isMajor && !drawMinor) || (isMajor && !drawMajor)) continue;
        const start = worldToOutput(x, minY);
        const end = worldToOutput(x, maxY);
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.strokeStyle = isMajor ? colors.major : colors.minor;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      for (let i = 0; i <= stepsY; i++) {
        const y = minY + i * grid.gridSizeMm;
        const isMajor = Math.round(y / grid.gridSizeMm) % 5 === 0;
        if ((!isMajor && !drawMinor) || (isMajor && !drawMajor)) continue;
        const start = worldToOutput(minX, y);
        const end = worldToOutput(maxX, y);
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.strokeStyle = isMajor ? colors.major : colors.minor;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      const axisHorizontalStart = worldToOutput(minX, 0);
      const axisHorizontalEnd = worldToOutput(maxX, 0);
      ctx.beginPath();
      ctx.moveTo(axisHorizontalStart.x, axisHorizontalStart.y);
      ctx.lineTo(axisHorizontalEnd.x, axisHorizontalEnd.y);
      ctx.strokeStyle = colors.axis;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      const axisVerticalStart = worldToOutput(0, minY);
      const axisVerticalEnd = worldToOutput(0, maxY);
      ctx.beginPath();
      ctx.moveTo(axisVerticalStart.x, axisVerticalStart.y);
      ctx.lineTo(axisVerticalEnd.x, axisVerticalEnd.y);
      ctx.strokeStyle = colors.axis;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  ctx.drawImage(source, dx, dy, drawWidth, drawHeight);
  return output;
};

const cloneCanvasPixels = (source: HTMLCanvasElement): HTMLCanvasElement => {
  const output = document.createElement('canvas');
  output.width = source.width;
  output.height = source.height;
  const ctx = output.getContext('2d');
  if (!ctx) return source;
  ctx.drawImage(source, 0, 0);
  return output;
};

const dataUrlToBlob = async (dataUrl: string): Promise<Blob> => {
  const response = await fetch(dataUrl);
  return response.blob();
};

const canvasToBlob = async (
  canvas: HTMLCanvasElement,
  mimeType: NonNullable<StageThumbnailOptions['mimeType']>,
  quality: number,
): Promise<Blob | null> => {
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(
      (nextBlob) => resolve(nextBlob),
      mimeType,
      mimeType === 'image/jpeg' ? quality : undefined,
    );
  });
  if (blob) return blob;
  try {
    const dataUrl = canvas.toDataURL(mimeType, mimeType === 'image/jpeg' ? quality : undefined);
    return await dataUrlToBlob(dataUrl);
  } catch {
    return null;
  }
};

const normalizeHexColor = (value: string, fallback: string): string => {
  const normalized = value.trim().replace('#', '');
  return /^[0-9a-fA-F]{6}$/.test(normalized) ? `#${normalized}` : fallback;
};

const tracePolygonPath = (
  ctx: CanvasRenderingContext2D,
  points: Point2D[],
  viewport: Viewport,
): void => {
  if (points.length === 0) return;
  const first = points[0]!;
  ctx.beginPath();
  ctx.moveTo(
    first.x * viewport.scale + viewport.offsetXPx,
    first.y * viewport.scale + viewport.offsetYPx,
  );
  for (let index = 1; index < points.length; index++) {
    const point = points[index]!;
    ctx.lineTo(
      point.x * viewport.scale + viewport.offsetXPx,
      point.y * viewport.scale + viewport.offsetYPx,
    );
  }
  ctx.closePath();
};

const paintProjectGrid = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  viewport: Viewport,
  gridSizeMm: number,
  theme: Theme,
): void => {
  if (gridSizeMm <= 0) return;
  const bounds = visibleWorldBounds(viewport, width, height);
  const padding = gridSizeMm * 5;
  const minX = Math.floor((bounds.minX - padding) / gridSizeMm) * gridSizeMm;
  const maxX = Math.ceil((bounds.maxX + padding) / gridSizeMm) * gridSizeMm;
  const minY = Math.floor((bounds.minY - padding) / gridSizeMm) * gridSizeMm;
  const maxY = Math.ceil((bounds.maxY + padding) / gridSizeMm) * gridSizeMm;
  const stepsX = Math.ceil((maxX - minX) / gridSizeMm);
  const stepsY = Math.ceil((maxY - minY) / gridSizeMm);
  if (stepsX > MAX_GRID_LINES_PER_AXIS || stepsY > MAX_GRID_LINES_PER_AXIS) return;

  const colors = GRID_COLORS[theme];
  const minorPx = gridSizeMm * viewport.scale;
  const majorPx = minorPx * 5;
  const drawMinor = minorPx >= 4;
  const drawMajor = majorPx >= 4;
  const worldToCanvas = (worldX: number, worldY: number) => ({
    x: worldX * viewport.scale + viewport.offsetXPx,
    y: worldY * viewport.scale + viewport.offsetYPx,
  });

  for (let index = 0; index <= stepsX; index++) {
    const x = minX + index * gridSizeMm;
    const isMajor = Math.round(x / gridSizeMm) % 5 === 0;
    if ((!isMajor && !drawMinor) || (isMajor && !drawMajor)) continue;
    const start = worldToCanvas(x, minY);
    const end = worldToCanvas(x, maxY);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = isMajor ? colors.major : colors.minor;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  for (let index = 0; index <= stepsY; index++) {
    const y = minY + index * gridSizeMm;
    const isMajor = Math.round(y / gridSizeMm) % 5 === 0;
    if ((!isMajor && !drawMinor) || (isMajor && !drawMajor)) continue;
    const start = worldToCanvas(minX, y);
    const end = worldToCanvas(maxX, y);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = isMajor ? colors.major : colors.minor;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  const axisHorizontalStart = worldToCanvas(minX, 0);
  const axisHorizontalEnd = worldToCanvas(maxX, 0);
  ctx.beginPath();
  ctx.moveTo(axisHorizontalStart.x, axisHorizontalStart.y);
  ctx.lineTo(axisHorizontalEnd.x, axisHorizontalEnd.y);
  ctx.strokeStyle = colors.axis;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const axisVerticalStart = worldToCanvas(0, minY);
  const axisVerticalEnd = worldToCanvas(0, maxY);
  ctx.beginPath();
  ctx.moveTo(axisVerticalStart.x, axisVerticalStart.y);
  ctx.lineTo(axisVerticalEnd.x, axisVerticalEnd.y);
  ctx.strokeStyle = colors.axis;
  ctx.lineWidth = 1.5;
  ctx.stroke();
};

type ProjectThumbnailRenderOptions = StageThumbnailOptions & {
  layouts?: MaterialLayout[];
};

export const captureProjectThumbnail = async (
  project: Project,
  options: ProjectThumbnailRenderOptions = {},
): Promise<Blob | null> => {
  const mimeType = options.mimeType ?? 'image/png';
  const quality = options.quality ?? 0.85;
  const backgroundColor = options.backgroundColor ?? DEFAULT_THUMBNAIL_BACKGROUND;
  const plan = computeThumbnailExportPlan(project, options);
  const viewport = plan.viewport;

  const output = document.createElement('canvas');
  output.width = plan.width;
  output.height = plan.height;
  const ctx = output.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, plan.width, plan.height);

  if (!viewport) {
    return canvasToBlob(output, mimeType, quality);
  }

  if (useEditorStore.getState().gridVisible) {
    paintProjectGrid(
      ctx,
      plan.width,
      plan.height,
      viewport,
      project.settings.gridSizeMm,
      getTheme(),
    );
  }

  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  for (const surface of project.surfaces) {
    tracePolygonPath(ctx, surface.outerBoundary, viewport);
    ctx.globalAlpha = surface.style.fillOpacity;
    ctx.fillStyle = normalizeHexColor(surface.style.fillColor, '#e6e9ee');
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = normalizeHexColor(surface.style.strokeColor, '#1f2937');
    ctx.lineWidth = Math.max(1, surface.style.strokeWidthPx);
    ctx.stroke();

    for (const hole of surface.holes) {
      tracePolygonPath(ctx, hole, viewport);
      ctx.fillStyle = backgroundColor;
      ctx.fill();
      ctx.strokeStyle = normalizeHexColor(surface.style.strokeColor, '#1f2937');
      ctx.lineWidth = Math.max(1, surface.style.strokeWidthPx * 0.85);
      ctx.stroke();
    }
  }

  for (const layout of options.layouts ?? []) {
    const material = project.materials.find((entry) => entry.id === layout.materialId);
    const fillColor = normalizeHexColor(material?.style.fillColor ?? '#d9c7a6', '#d9c7a6');
    const strokeColor = normalizeHexColor(material?.style.jointColor ?? '#7c6f5b', '#7c6f5b');

    for (const piece of layout.pieces) {
      tracePolygonPath(ctx, piece.visiblePolygon, viewport);
      ctx.globalAlpha = 1;
      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1;
      ctx.stroke();

      for (const [index, overlap] of piece.overlapPolygons.entries()) {
        tracePolygonPath(ctx, overlap, viewport);
        ctx.globalAlpha =
          piece.overlapPolygonOpacities?.[index] ?? project.settings.defaultOverlapOpacity;
        ctx.fillStyle = fillColor;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      tracePolygonPath(ctx, piece.physicalPolygon, viewport);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  }

  for (const entity of project.drawingEntities) {
    ctx.globalAlpha = entity.style.fillOpacity ?? 1;
    ctx.strokeStyle = normalizeHexColor(entity.style.strokeColor, '#334155');
    ctx.lineWidth = Math.max(1, entity.style.strokeWidthPx);
    ctx.setLineDash(entity.style.strokeDash ?? []);

    if (entity.type === 'line') {
      ctx.beginPath();
      ctx.moveTo(
        entity.start.x * viewport.scale + viewport.offsetXPx,
        entity.start.y * viewport.scale + viewport.offsetYPx,
      );
      ctx.lineTo(
        entity.end.x * viewport.scale + viewport.offsetXPx,
        entity.end.y * viewport.scale + viewport.offsetYPx,
      );
      ctx.stroke();
      continue;
    }

    const points =
      entity.type === 'rectangle'
        ? rectangleToPoints(entity.origin, entity.widthMm, entity.heightMm, entity.rotationDeg)
        : entity.points;
    tracePolygonPath(ctx, points, viewport);
    if (entity.style.fillColor) {
      ctx.fillStyle = normalizeHexColor(entity.style.fillColor, '#cbd5e1');
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.stroke();
  }
  ctx.setLineDash([]);

  for (const label of project.labels) {
    if (label.anchorType !== 'free') continue;
    const text = label.style.uppercase ? label.text.toUpperCase() : label.text;
    const x = label.position.x * viewport.scale + viewport.offsetXPx;
    const y = label.position.y * viewport.scale + viewport.offsetYPx;
    const fontWeight = label.style.bold ? '600' : '400';
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((label.rotationDeg * Math.PI) / 180);
    ctx.font = `${fontWeight} ${Math.max(12, label.style.fontSizePx)}px Arial`;
    ctx.fillStyle = normalizeHexColor(label.style.textColor, '#111827');
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }

  return canvasToBlob(output, mimeType, quality);
};

const renderLiveStageToCanvas = async (
  stage: Konva.Stage,
  layer: Konva.Layer,
  viewport: Viewport,
  pixelRatio: number,
): Promise<HTMLCanvasElement> => {
  const prevX = layer.x();
  const prevY = layer.y();
  const prevScaleX = layer.scaleX();
  const prevScaleY = layer.scaleY();
  try {
    layer.position({ x: viewport.offsetXPx, y: viewport.offsetYPx });
    layer.scale({ x: viewport.scale, y: viewport.scale });
    await settleStageForCapture(stage);
    const domCanvas = stage.container().querySelector('canvas');
    if (domCanvas instanceof HTMLCanvasElement) {
      if (pixelRatio <= 1) {
        return cloneCanvasPixels(domCanvas);
      }
      return stage.toCanvas({ pixelRatio });
    }
    return stage.toCanvas({ pixelRatio });
  } finally {
    layer.position({ x: prevX, y: prevY });
    layer.scale({ x: prevScaleX, y: prevScaleY });
    await settleStageForCapture(stage);
  }
};

export const captureStageThumbnail = async (
  options: StageThumbnailOptions = {},
): Promise<Blob | null> => {
  return serializeStageCapture(async () => {
    const stage = activeStage;
    if (!stage) return null;
    const mimeType = options.mimeType ?? 'image/png';
    const quality = options.quality ?? 0.85;
    const backgroundColor = options.backgroundColor ?? DEFAULT_THUMBNAIL_BACKGROUND;
    const project = useProjectStore.getState().project;
    const editor = useEditorStore.getState();
    const plan = computeThumbnailExportPlan(project, options);
    const worldLayer = stage.findOne<Konva.Layer>('.world');
    const stageWidth = stage.width();
    const stageHeight = stage.height();
    if (stageWidth <= 0 || stageHeight <= 0) return null;
    const desiredPixelRatio = Math.max(
      1,
      options.pixelRatio ?? (options.targetWidth ? options.targetWidth / stageWidth : 1),
    );

    let rendered: HTMLCanvasElement;
    let grid: ThumbnailGridOptions | undefined;
    if (worldLayer && plan.viewport) {
      const capturePlan = computeThumbnailExportPlan(project, {
        targetWidth: stageWidth,
        targetHeight: stageHeight,
        paddingPx: options.paddingPx,
      });
      grid = editor.gridVisible
        ? {
            viewport: capturePlan.viewport ?? plan.viewport,
            gridSizeMm: project.settings.gridSizeMm,
            theme: getTheme(),
          }
        : undefined;
      rendered = capturePlan.viewport
        ? await renderLiveStageToCanvas(stage, worldLayer, capturePlan.viewport, desiredPixelRatio)
        : stage.toCanvas({ pixelRatio: desiredPixelRatio });
    } else {
      await settleStageForCapture(stage);
      const domCanvas = stage.container().querySelector('canvas');
      rendered =
        domCanvas instanceof HTMLCanvasElement
          ? desiredPixelRatio <= 1
            ? cloneCanvasPixels(domCanvas)
            : stage.toCanvas({ pixelRatio: desiredPixelRatio })
          : stage.toCanvas({ pixelRatio: desiredPixelRatio });
    }

    const output = paintContainedCanvas(rendered, plan.width, plan.height, backgroundColor, grid);
    return canvasToBlob(output, mimeType, quality);
  });
};
