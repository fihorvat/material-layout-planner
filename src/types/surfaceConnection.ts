import { z } from 'zod';

const idString = z.string().min(1);

export const SurfaceConnectionRefSchema = z
  .object({
    connectionId: idString,
  })
  .strict();

export type SurfaceConnectionRef = z.infer<typeof SurfaceConnectionRefSchema>;

export const SurfaceConnectionSchema = z
  .object({
    id: idString,
    surfaceAId: idString,
    edgeAId: idString,
    surfaceBId: idString,
    edgeBId: idString,
    connectionType: z.enum([
      'outsideCorner',
      'insideCorner',
      'flatContinuation',
      'buttJoint',
      'custom',
    ]),
    angleDeg: z.number().finite(),
    jointAtConnectionMm: z.number().finite().nonnegative(),
    allowPatternContinuation: z.boolean(),
    allowPhysicalOverlap: z.boolean(),
    defaultOverlapMm: z.number().finite().nonnegative(),
    overlapOpacity: z.number().min(0).max(1),
    thicknessMode: z.enum([
      'ignoreThickness',
      'showThicknessOnly',
      'compensateCoveredEdge',
      'customAllowance',
    ]),
  })
  .strict();

export type SurfaceConnection = z.infer<typeof SurfaceConnectionSchema>;
