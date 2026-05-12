import { z } from 'zod';
import { Point2DSchema } from './geometry';
import { DrawingStyleSchema } from './style';

const idString = z.string().min(1);

export const LineEntitySchema = z
  .object({
    id: idString,
    type: z.literal('line'),
    start: Point2DSchema,
    end: Point2DSchema,
    name: z.string().optional(),
    showDimension: z.boolean(),
    style: DrawingStyleSchema,
  })
  .strict();

export type LineEntity = z.infer<typeof LineEntitySchema>;

export const RectangleEntitySchema = z
  .object({
    id: idString,
    type: z.literal('rectangle'),
    origin: Point2DSchema,
    widthMm: z.number().finite().positive(),
    heightMm: z.number().finite().positive(),
    rotationDeg: z.number().finite(),
    name: z.string().optional(),
    showDimensions: z.boolean(),
    style: DrawingStyleSchema,
  })
  .strict();

export type RectangleEntity = z.infer<typeof RectangleEntitySchema>;

export const PolygonEntitySchema = z
  .object({
    id: idString,
    type: z.literal('polygon'),
    points: z.array(Point2DSchema).min(3),
    name: z.string().optional(),
    showSegmentDimensions: z.boolean(),
    showArea: z.boolean(),
    style: DrawingStyleSchema,
  })
  .strict();

export type PolygonEntity = z.infer<typeof PolygonEntitySchema>;

export const DrawingEntitySchema = z.discriminatedUnion('type', [
  LineEntitySchema,
  RectangleEntitySchema,
  PolygonEntitySchema,
]);

export type DrawingEntity = z.infer<typeof DrawingEntitySchema>;
