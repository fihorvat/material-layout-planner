import { z } from 'zod';
import { Point2DSchema } from './geometry';
import { SurfaceStyleSchema } from './style';
import { EdgeRuleSchema } from './edgeRule';
import { SurfaceConnectionRefSchema } from './surfaceConnection';

const idString = z.string().min(1);

export const SurfaceSchema = z
  .object({
    id: idString,
    name: z.string().min(1),

    outerBoundary: z.array(Point2DSchema).min(3),
    holes: z.array(z.array(Point2DSchema).min(3)),

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
