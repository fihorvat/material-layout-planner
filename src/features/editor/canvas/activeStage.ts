import type Konva from 'konva';

let activeStage: Konva.Stage | null = null;

export const setActiveStage = (stage: Konva.Stage | null): void => {
  activeStage = stage;
};

export const getActiveStage = (): Konva.Stage | null => activeStage;

export type StageThumbnailOptions = {
  targetWidth?: number;
  mimeType?: 'image/png' | 'image/jpeg';
  quality?: number;
};

export const captureStageThumbnail = async (
  options: StageThumbnailOptions = {},
): Promise<Blob | null> => {
  const stage = activeStage;
  if (!stage) return null;
  const targetWidth = options.targetWidth ?? 320;
  const mimeType = options.mimeType ?? 'image/png';
  const quality = options.quality ?? 0.85;
  const stageWidth = stage.width();
  if (stageWidth <= 0) return null;
  const pixelRatio = Math.min(targetWidth / stageWidth, 1);
  const canvas = stage.toCanvas({ pixelRatio });
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob),
      mimeType,
      mimeType === 'image/jpeg' ? quality : undefined,
    );
  });
};
