import { z } from 'zod';
import { Point2DSchema } from './geometry';

const idString = z.string().min(1);

export const BackgroundImageCalibrationSchema = z
  .object({
    pointAPx: Point2DSchema,
    pointBPx: Point2DSchema,
    distanceMm: z.number().finite().positive(),
  })
  .strict();

export type BackgroundImageCalibration = z.infer<typeof BackgroundImageCalibrationSchema>;

export const BackgroundImageRefSchema = z
  .object({
    id: idString,
    dataUrl: z.string().min(1).optional(),
    blobKey: z.string().min(1).optional(),
    position: Point2DSchema,
    rotationDeg: z.number().finite(),
    scaleMmPerPx: z.number().finite().positive(),
    opacity01: z.number().min(0).max(1),
    locked: z.boolean(),
    visible: z.boolean(),
    calibration: BackgroundImageCalibrationSchema.nullable(),
  })
  .strict();

export type BackgroundImageRef = z.infer<typeof BackgroundImageRefSchema>;
