import { z } from 'zod';
import { Point2DSchema } from './geometry';

const idString = z.string().min(1);

export const OptimizationPrioritySchema = z
  .object({
    wasteWeight: z.number().finite().nonnegative(),
    symmetryWeight: z.number().finite().nonnegative(),
    cutCountWeight: z.number().finite().nonnegative(),
    smallPieceWeight: z.number().finite().nonnegative(),
    jointAlignmentWeight: z.number().finite().nonnegative(),
    manualOffsetLocked: z.boolean(),
  })
  .strict();

export type OptimizationPriority = z.infer<typeof OptimizationPrioritySchema>;

export const PlacementPatternSchema = z
  .object({
    id: idString,
    name: z.string().min(1),

    type: z.enum([
      'stacked',
      'runningBondHalf',
      'runningBondThird',
      'verticalStacked',
      'customOffset',
      'diagonal',
    ]),

    orientation: z.enum(['horizontal', 'vertical', 'customAngle']),

    angleDeg: z.number().finite(),

    jointMm: z.number().finite().nonnegative(),

    offsetXmm: z.number().finite(),
    offsetYmm: z.number().finite(),

    rowOffsetMm: z.number().finite(),
    rowOffsetPercent: z.number().finite(),

    originMode: z.enum(['surfaceCenter', 'topLeft', 'bottomLeft', 'customPoint']),

    customOrigin: Point2DSchema.optional(),

    direction: z.enum(['leftToRight', 'rightToLeft', 'topToBottom', 'bottomToTop']),

    symmetryMode: z.enum(['none', 'verticalAxis', 'horizontalAxis', 'customAxis']),

    optimizationPriority: OptimizationPrioritySchema,
  })
  .strict();

export type PlacementPattern = z.infer<typeof PlacementPatternSchema>;
