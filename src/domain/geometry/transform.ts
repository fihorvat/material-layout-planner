import type { Point2D } from '@/types';
import { degToRad } from './point';

export type Mat3 = readonly [
  number, number, number,
  number, number, number,
  number, number, number,
];

export const identity = (): Mat3 => [1, 0, 0, 0, 1, 0, 0, 0, 1] as const;

export const translate = (tx: number, ty: number): Mat3 =>
  [1, 0, tx, 0, 1, ty, 0, 0, 1] as const;

export const scaleMat = (sx: number, sy: number): Mat3 =>
  [sx, 0, 0, 0, sy, 0, 0, 0, 1] as const;

export const rotateMat = (angleDeg: number): Mat3 => {
  const r = degToRad(angleDeg);
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [c, -s, 0, s, c, 0, 0, 0, 1] as const;
};

export const multiply = (a: Mat3, b: Mat3): Mat3 => {
  const r = new Array<number>(9);
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      r[row * 3 + col] =
        a[row * 3]! * b[col]! +
        a[row * 3 + 1]! * b[3 + col]! +
        a[row * 3 + 2]! * b[6 + col]!;
    }
  }
  return r as unknown as Mat3;
};

export const applyTo = (m: Mat3, p: Point2D): Point2D => ({
  x: m[0] * p.x + m[1] * p.y + m[2],
  y: m[3] * p.x + m[4] * p.y + m[5],
});
