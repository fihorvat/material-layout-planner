import { z } from 'zod';

const colorString = z.string().min(1);

export const DrawingStyleSchema = z
  .object({
    strokeColor: colorString,
    strokeWidthPx: z.number().finite().nonnegative(),
    strokeDash: z.array(z.number().finite().nonnegative()).optional(),
    fillColor: colorString.optional(),
    fillOpacity: z.number().min(0).max(1).optional(),
    textColor: colorString,
    fontSizePx: z.number().finite().positive(),
  })
  .strict();

export type DrawingStyle = z.infer<typeof DrawingStyleSchema>;

export const DimensionStyleSchema = z
  .object({
    strokeColor: colorString,
    strokeWidthPx: z.number().finite().nonnegative(),
    strokeDash: z.array(z.number().finite().nonnegative()).optional(),
    fillColor: colorString.optional(),
    fillOpacity: z.number().min(0).max(1).optional(),
    textColor: colorString,
    fontSizePx: z.number().finite().positive(),
    arrowSizePx: z.number().finite().nonnegative(),
    textOffsetMm: z.number().finite(),
  })
  .strict();

export type DimensionStyle = z.infer<typeof DimensionStyleSchema>;

export const TextStyleSchema = z
  .object({
    fontSizePx: z.number().finite().positive(),
    textColor: colorString,
    bold: z.boolean(),
    italic: z.boolean(),
  })
  .strict();

export type TextStyle = z.infer<typeof TextStyleSchema>;

export const MaterialStyleSchema = z
  .object({
    fillColor: colorString,
    labelColor: colorString,
    jointColor: colorString,
  })
  .strict();

export type MaterialStyle = z.infer<typeof MaterialStyleSchema>;

export const SurfaceStyleSchema = z
  .object({
    strokeColor: colorString,
    strokeWidthPx: z.number().finite().nonnegative(),
    fillColor: colorString,
    fillOpacity: z.number().min(0).max(1),
    textColor: colorString,
  })
  .strict();

export type SurfaceStyle = z.infer<typeof SurfaceStyleSchema>;
