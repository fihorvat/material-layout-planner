import { z } from 'zod';
import { MaterialStyleSchema } from './style';

const idString = z.string().min(1);

export const MaterialSchema = z
  .object({
    id: idString,
    name: z.string().min(1),

    unitWidthMm: z.number().finite().positive(),
    unitHeightMm: z.number().finite().positive(),
    thicknessMm: z.number().finite().positive(),

    defaultOrientation: z.enum(['horizontal', 'vertical']),
    defaultJointMm: z.number().finite().nonnegative(),

    minPieceWidthMm: z.number().finite().nonnegative(),
    minPieceHeightMm: z.number().finite().nonnegative(),

    style: MaterialStyleSchema,
  })
  .strict();

export type Material = z.infer<typeof MaterialSchema>;
