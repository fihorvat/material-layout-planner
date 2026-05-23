import type Konva from 'konva';
import type { Project } from '@/types';
import { useProjectStore, type Viewport } from '@/state';
import { computeFitViewport, computeProjectContentBounds } from './fitToContent';

let activeStage: Konva.Stage | null = null;

export const setActiveStage = (stage: Konva.Stage | null): void => {
  activeStage = stage;
};

export const getActiveStage = (): Konva.Stage | null => activeStage;

type StageThumbnailOptions = {
  targetWidth?: number;
  targetHeight?: number;
  mimeType?: 'image/png' | 'image/jpeg';
  quality?: number;
  paddingPx?: number;
  backgroundColor?: string;
};

type ThumbnailExportPlan = {
  width: number;
  height: number;
  viewport: Viewport | null;
};

const DEFAULT_THUMBNAIL_ASPECT_RATIO = 4 / 3;
const DEFAULT_THUMBNAIL_PADDING_PX = 24;
const DEFAULT_THUMBNAIL_BACKGROUND = '#f6f3eb';

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
      ? computeFitViewport(bounds, { width, height }, options.paddingPx ?? DEFAULT_THUMBNAIL_PADDING_PX)
      : null,
  };
};

const paintContainedCanvas = (
  source: HTMLCanvasElement,
  width: number,
  height: number,
  backgroundColor: string,
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

const canvasToBlob = async (
  canvas: HTMLCanvasElement,
  mimeType: NonNullable<StageThumbnailOptions['mimeType']>,
  quality: number,
): Promise<Blob | null> =>
  new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob),
      mimeType,
      mimeType === 'image/jpeg' ? quality : undefined,
    );
  });

const renderLiveStageToCanvas = async (
  stage: Konva.Stage,
  layer: Konva.Layer,
  viewport: Viewport,
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
      return cloneCanvasPixels(domCanvas);
    }
    return stage.toCanvas({ pixelRatio: 1 });
  } finally {
    layer.position({ x: prevX, y: prevY });
    layer.scale({ x: prevScaleX, y: prevScaleY });
    await settleStageForCapture(stage);
  }
};

export const captureStageThumbnail = async (
  options: StageThumbnailOptions = {},
): Promise<Blob | null> => {
  const stage = activeStage;
  if (!stage) return null;
  const mimeType = options.mimeType ?? 'image/png';
  const quality = options.quality ?? 0.85;
  const backgroundColor = options.backgroundColor ?? DEFAULT_THUMBNAIL_BACKGROUND;
  const project = useProjectStore.getState().project;
  const plan = computeThumbnailExportPlan(project, options);
  const worldLayer = stage.findOne<Konva.Layer>('.world');
  const stageWidth = stage.width();
  const stageHeight = stage.height();
  if (stageWidth <= 0 || stageHeight <= 0) return null;

  let rendered: HTMLCanvasElement;
  if (worldLayer && plan.viewport) {
    const capturePlan = computeThumbnailExportPlan(project, {
      targetWidth: stageWidth,
      targetHeight: stageHeight,
      paddingPx: options.paddingPx,
    });
    rendered = capturePlan.viewport
      ? await renderLiveStageToCanvas(stage, worldLayer, capturePlan.viewport)
      : stage.toCanvas({ pixelRatio: 1 });
  } else {
    await settleStageForCapture(stage);
    const domCanvas = stage.container().querySelector('canvas');
    rendered = domCanvas instanceof HTMLCanvasElement ? cloneCanvasPixels(domCanvas) : stage.toCanvas({ pixelRatio: 1 });
  }

  const output = paintContainedCanvas(rendered, plan.width, plan.height, backgroundColor);
  return canvasToBlob(output, mimeType, quality);
};
