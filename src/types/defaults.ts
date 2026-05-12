import type { DrawingStyle, SurfaceStyle, MaterialStyle, DimensionStyle, TextStyle } from './style';
import type { ProjectSettings } from './project';
import type { PdfExportSettings } from './pdf';
import type { OptimizationPriority } from './placementPattern';
import type { Project } from './project';

export const defaultDrawingStyle = (): DrawingStyle => ({
  strokeColor: '#1f2937',
  strokeWidthPx: 1,
  textColor: '#111827',
  fontSizePx: 12,
});

export const defaultSurfaceStyle = (): SurfaceStyle => ({
  strokeColor: '#1f2937',
  strokeWidthPx: 1.5,
  fillColor: '#e5e7eb',
  fillOpacity: 0.4,
  textColor: '#111827',
});

export const defaultMaterialStyle = (): MaterialStyle => ({
  fillColor: '#d6c2a4',
  labelColor: '#111827',
  jointColor: '#9ca3af',
});

export const defaultDimensionStyle = (): DimensionStyle => ({
  strokeColor: '#374151',
  strokeWidthPx: 1,
  textColor: '#111827',
  fontSizePx: 11,
  arrowSizePx: 6,
  textOffsetMm: 8,
});

export const defaultTextStyle = (): TextStyle => ({
  fontSizePx: 12,
  textColor: '#111827',
  bold: false,
  italic: false,
});

export const defaultProjectSettings = (): ProjectSettings => ({
  gridSizeMm: 50,
  snapEnabled: true,
  snapTolerancePx: 8,
  defaultLineColor: '#1f2937',
  defaultTextColor: '#111827',
  defaultOverlapOpacity: 0.25,
  autosaveEnabled: true,
});

export const defaultPdfSettings = (): PdfExportSettings => ({
  paperSize: 'A4',
  orientation: 'portrait',
  scaleMode: 'auto',
  includeFinalAppearance: true,
  includeTechnicalDrawing: true,
  includeMaterialLayout: true,
  includeDimensions: true,
  includeSurfaceNames: true,
  includePieceIds: true,
  includePieceDimensions: true,
  includeOverlapZones: true,
  includeCutList: true,
  includeCuttingDiagrams: true,
  includeInstallationInstructions: true,
});

export const defaultOptimizationPriority = (): OptimizationPriority => ({
  wasteWeight: 1,
  symmetryWeight: 1,
  cutCountWeight: 1,
  smallPieceWeight: 2,
  jointAlignmentWeight: 0,
  manualOffsetLocked: false,
});

export const createEmptyProject = (
  name: string,
  opts?: { id?: string; now?: string },
): Project => {
  const now = opts?.now ?? new Date().toISOString();
  return {
    schemaVersion: 1,
    id: opts?.id ?? 'project-empty',
    name,
    unit: 'mm',
    createdAt: now,
    updatedAt: now,
    settings: defaultProjectSettings(),
    materials: [],
    surfaces: [],
    surfaceConnections: [],
    drawingEntities: [],
    dimensions: [],
    labels: [],
    placementPatterns: [],
    materialLayouts: [],
    backgroundImages: [],
    pdfSettings: defaultPdfSettings(),
  };
};
