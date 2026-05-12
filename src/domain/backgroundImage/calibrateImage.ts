import type { Point2D, BackgroundImageRef } from '@/types';

export type CalibrationInput = {
  image: BackgroundImageRef;
  pointAPx: Point2D;
  pointBPx: Point2D;
  realDistanceMm: number;
};

export type CalibrationResult = {
  scaleMmPerPx: number;
  position: Point2D;
  calibration: { pointAPx: Point2D; pointBPx: Point2D; distanceMm: number };
};

export const calibrateImage = (input: CalibrationInput): CalibrationResult => {
  const dx = input.pointBPx.x - input.pointAPx.x;
  const dy = input.pointBPx.y - input.pointAPx.y;
  const pixelDistance = Math.hypot(dx, dy);
  if (pixelDistance < 1e-6) {
    throw new Error('Calibration points must be distinct');
  }
  if (input.realDistanceMm <= 0) {
    throw new Error('Calibration distance must be positive');
  }
  const newScale = input.realDistanceMm / pixelDistance;
  const midPxX = (input.pointAPx.x + input.pointBPx.x) / 2;
  const midPxY = (input.pointAPx.y + input.pointBPx.y) / 2;
  // Keep the world midpoint of A/B stationary after re-scaling.
  const worldMidX = input.image.position.x + midPxX * input.image.scaleMmPerPx;
  const worldMidY = input.image.position.y + midPxY * input.image.scaleMmPerPx;
  const newPosition: Point2D = {
    x: worldMidX - midPxX * newScale,
    y: worldMidY - midPxY * newScale,
  };
  return {
    scaleMmPerPx: newScale,
    position: newPosition,
    calibration: {
      pointAPx: input.pointAPx,
      pointBPx: input.pointBPx,
      distanceMm: input.realDistanceMm,
    },
  };
};
