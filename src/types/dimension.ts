import { z } from 'zod';
import { DimensionStyleSchema } from './style';

const idString = z.string().min(1);

export const DimensionReferenceSchema = z
  .object({
    kind: z.enum(['point', 'line', 'edge', 'entity']),
    id: idString,
    pointIndex: z.number().int().nonnegative().optional(),
  })
  .strict();

export type DimensionReference = z.infer<typeof DimensionReferenceSchema>;

export const DimensionEntitySchema = z
  .object({
    id: idString,
    type: z.literal('dimension'),
    dimensionType: z.enum(['horizontal', 'vertical', 'aligned', 'angle', 'area']),
    references: z.array(DimensionReferenceSchema),
    textOverride: z.string().optional(),
    offsetMm: z.number().finite(),
    style: DimensionStyleSchema,
  })
  .strict();

export type DimensionEntity = z.infer<typeof DimensionEntitySchema>;
