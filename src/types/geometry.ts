import { z } from 'zod';

export const Point2DSchema = z
  .object({
    x: z.number().finite(),
    y: z.number().finite(),
  })
  .strict();

export type Point2D = z.infer<typeof Point2DSchema>;
