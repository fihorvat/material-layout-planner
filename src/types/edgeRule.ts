import { z } from 'zod';

const idString = z.string().min(1);

export const EdgeRuleSchema = z
  .object({
    id: idString,
    surfaceId: idString,
    edgeIndex: z.number().int().nonnegative(),
    ruleType: z.enum(['hardStop', 'softBoundary', 'physicalOverlap', 'connectedOverlap']),
    maxOverlapMm: z.number().finite().nonnegative(),
    overlapOpacity: z.number().min(0).max(1),
    connectedSurfaceId: idString.optional(),
    connectedEdgeIndex: z.number().int().nonnegative().optional(),
    applyThicknessCompensation: z.boolean(),
    customThicknessAllowanceMm: z.number().finite().nonnegative().optional(),
  })
  .strict();

export type EdgeRule = z.infer<typeof EdgeRuleSchema>;
