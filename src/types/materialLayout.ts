import { z } from 'zod';
import { Point2DSchema } from './geometry';
import { MaterialSchema } from './material';
import { PlacementPatternSchema } from './placementPattern';
import { EdgeRuleSchema } from './edgeRule';

const idString = z.string().min(1);

export const MaterialPieceWarningSchema = z
  .object({
    code: z.string().min(1),
    messageKey: z.string().min(1),
    severity: z.enum(['info', 'warning', 'error']),
  })
  .strict();

export type MaterialPieceWarning = z.infer<typeof MaterialPieceWarningSchema>;

export const MaterialPieceSchema = z
  .object({
    id: idString,

    surfaceId: idString,
    materialId: idString,

    pieceCode: z.string().min(1),

    sourceUnitIndex: z.number().int().nonnegative().optional(),

    physicalPolygon: z.array(Point2DSchema).min(3),
    visiblePolygon: z.array(Point2DSchema).min(3),
    overlapPolygons: z.array(z.array(Point2DSchema).min(3)),

    boundingWidthMm: z.number().finite().nonnegative(),
    boundingHeightMm: z.number().finite().nonnegative(),
    thicknessMm: z.number().finite().positive(),

    rotationDeg: z.number().finite(),

    isFullUnit: z.boolean(),
    isCutPiece: z.boolean(),
    isIrregular: z.boolean(),

    labelPosition: Point2DSchema,

    warnings: z.array(MaterialPieceWarningSchema),
  })
  .strict();

export type MaterialPiece = z.infer<typeof MaterialPieceSchema>;

export const MaterialLayoutStatsSchema = z
  .object({
    visibleAreaMm2: z.number().finite().nonnegative(),
    physicalMaterialAreaMm2: z.number().finite().nonnegative(),
    purchasedMaterialAreaMm2: z.number().finite().nonnegative(),

    fullUnitCount: z.number().int().nonnegative(),
    cutPieceCount: z.number().int().nonnegative(),
    totalPieceCount: z.number().int().nonnegative(),

    wasteAreaMm2: z.number().finite().nonnegative(),
    wastePercent: z.number().finite().min(0).max(100),

    uniqueCutCount: z.number().int().nonnegative(),
    smallPieceCount: z.number().int().nonnegative(),
  })
  .strict();

export type MaterialLayoutStats = z.infer<typeof MaterialLayoutStatsSchema>;

export const MaterialLayoutSettingsSnapshotSchema = z
  .object({
    material: MaterialSchema,
    placementPattern: PlacementPatternSchema,
    edgeRules: z.array(EdgeRuleSchema),
  })
  .strict();

export type MaterialLayoutSettingsSnapshot = z.infer<typeof MaterialLayoutSettingsSnapshotSchema>;

export const MaterialLayoutSchema = z
  .object({
    id: idString,

    surfaceId: idString,
    materialId: idString,
    placementPatternId: idString,

    generatedAt: z.string().min(1),

    pieces: z.array(MaterialPieceSchema),

    stats: MaterialLayoutStatsSchema,

    settingsSnapshot: MaterialLayoutSettingsSnapshotSchema,
  })
  .strict();

export type MaterialLayout = z.infer<typeof MaterialLayoutSchema>;
