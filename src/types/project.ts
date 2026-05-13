import { z } from 'zod';
import { MaterialSchema } from './material';
import { SurfaceSchema } from './surface';
import { SurfaceConnectionSchema } from './surfaceConnection';
import { DrawingEntitySchema } from './drawing';
import { DimensionEntitySchema } from './dimension';
import { LabelEntitySchema } from './label';
import { PlacementPatternSchema } from './placementPattern';
import { MaterialLayoutSchema } from './materialLayout';
import { BackgroundImageRefSchema } from './backgroundImage';
import { PdfExportSettingsSchema } from './pdf';

const idString = z.string().min(1);

export const ProjectSettingsSchema = z
  .object({
    gridSizeMm: z.number().finite().positive(),
    snapEnabled: z.boolean(),
    snapTolerancePx: z.number().finite().nonnegative(),

    defaultLineColor: z.string().min(1),
    defaultTextColor: z.string().min(1),

    defaultOverlapOpacity: z.number().min(0).max(1),

    // Saw blade thickness (kerf) used when packing pieces onto raw material
    // sheets. Each cut consumes this width of material, so adjacent pieces
    // must be spaced by at least this amount. Defaulted for backwards
    // compatibility with v1 projects saved before this field existed.
    bladeKerfMm: z.number().finite().nonnegative().default(2.5),

    autosaveEnabled: z.boolean(),
  })
  .strict();

export type ProjectSettings = z.infer<typeof ProjectSettingsSchema>;

export const ProjectSchema = z
  .object({
    schemaVersion: z.literal(1),

    id: idString,
    name: z.string().min(1),
    unit: z.literal('mm'),

    createdAt: z.string().min(1),
    updatedAt: z.string().min(1),

    settings: ProjectSettingsSchema,

    materials: z.array(MaterialSchema),
    surfaces: z.array(SurfaceSchema),
    surfaceConnections: z.array(SurfaceConnectionSchema),

    drawingEntities: z.array(DrawingEntitySchema),
    dimensions: z.array(DimensionEntitySchema),
    labels: z.array(LabelEntitySchema),

    placementPatterns: z.array(PlacementPatternSchema),
    materialLayouts: z.array(MaterialLayoutSchema),

    backgroundImages: z.array(BackgroundImageRefSchema),

    pdfSettings: PdfExportSettingsSchema,
  })
  .strict();

export type Project = z.infer<typeof ProjectSchema>;
