import { describe, expect, it } from 'vitest';
import { calibrateImage } from '../calibrateImage';
import type { BackgroundImageRef } from '@/types';

const baseImage: BackgroundImageRef = {
  id: 'bgi_1',
  position: { x: 0, y: 0 },
  rotationDeg: 0,
  scaleMmPerPx: 1,
  opacity01: 1,
  locked: false,
  visible: true,
  calibration: null,
};

describe('calibrateImage', () => {
  it('produces scale = realDist / pixelDist', () => {
    const r = calibrateImage({
      image: baseImage,
      pointAPx: { x: 0, y: 0 },
      pointBPx: { x: 100, y: 0 },
      realDistanceMm: 250,
    });
    expect(r.scaleMmPerPx).toBeCloseTo(2.5);
  });

  it('throws on coincident points', () => {
    expect(() =>
      calibrateImage({
        image: baseImage,
        pointAPx: { x: 0, y: 0 },
        pointBPx: { x: 0, y: 0 },
        realDistanceMm: 100,
      }),
    ).toThrow();
  });

  it('throws on non-positive distance', () => {
    expect(() =>
      calibrateImage({
        image: baseImage,
        pointAPx: { x: 0, y: 0 },
        pointBPx: { x: 10, y: 0 },
        realDistanceMm: 0,
      }),
    ).toThrow();
  });
});
