import { z } from 'zod';
import { Point2DSchema } from './geometry';
import { TextStyleSchema } from './style';

const idString = z.string().min(1);

export const LabelEntitySchema = z
  .object({
    id: idString,
    text: z.string(),
    anchorType: z.enum(['free', 'surface', 'materialPiece', 'edge', 'opening']),
    anchorId: idString.optional(),
    position: Point2DSchema,
    rotationDeg: z.number().finite(),
    style: TextStyleSchema,
  })
  .strict();

export type LabelEntity = z.infer<typeof LabelEntitySchema>;
