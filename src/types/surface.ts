import { z } from 'zod';
import { Point2DSchema } from './geometry';
import { SurfaceStyleSchema, DrawingStyleSchema } from './style';
import { EdgeRuleSchema } from './edgeRule';
import { SurfaceConnectionRefSchema } from './surfaceConnection';

const idString = z.string().min(1);

export const SurfaceHoleMetaSchema = z
  .object({
    id: idString,
    name: z.string().optional(),
    showDimensions: z.boolean(),
    style: DrawingStyleSchema,
    labelOffset: Point2DSchema.optional(),
  })
  .strict();

export type SurfaceHoleMeta = z.infer<typeof SurfaceHoleMetaSchema>;

export const SurfaceSchema = z
  .object({
    id: idString,
    name: z.string().min(1),

    outerBoundary: z.array(Point2DSchema).min(3),
    holes: z.array(z.array(Point2DSchema).min(3)),
    holeMeta: z.array(SurfaceHoleMetaSchema).default([]),

    materialId: idString.nullable(),
    placementPatternId: idString.nullable(),

    edgeRules: z.array(EdgeRuleSchema),
    connections: z.array(SurfaceConnectionRefSchema),

    showName: z.boolean(),
    showDimensions: z.boolean(),
    showArea: z.boolean(),

    style: SurfaceStyleSchema,
  })
  .strict();

export type Surface = z.infer<typeof SurfaceSchema>;
