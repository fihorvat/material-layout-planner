import { z } from 'zod';

export const PdfExportSettingsSchema = z
  .object({
    paperSize: z.enum(['A4', 'A3']),
    orientation: z.enum(['portrait', 'landscape']),
    scaleMode: z.enum(['auto', 'fixed', 'custom']),
    fixedScale: z.enum(['1:5', '1:10', '1:20']).optional(),
    customScale: z.number().finite().positive().optional(),

    includeFinalAppearance: z.boolean(),
    includeTechnicalDrawing: z.boolean(),
    includeMaterialLayout: z.boolean(),
    includeDimensions: z.boolean(),
    includeSurfaceNames: z.boolean(),
    includePieceIds: z.boolean(),
    includePieceDimensions: z.boolean(),
    includeOverlapZones: z.boolean(),
    includeCutList: z.boolean(),
    includeCuttingDiagrams: z.boolean(),
    includeInstallationInstructions: z.boolean(),
  })
  .strict();

export type PdfExportSettings = z.infer<typeof PdfExportSettingsSchema>;
