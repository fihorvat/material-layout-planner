import type { Project } from '@/types';

export type MaterialCutListItem = {
  materialId: string;
  materialName: string;
  surfaceId: string;
  surfaceName: string;
  widthMm: number;
  heightMm: number;
  thicknessMm: number;
  quantity: number;
  pieceCodes: string[];
  isFullUnit: boolean;
  isRectangularCut: boolean;
  isIrregularCut: boolean;
  overlapIncluded: boolean;
  notes: string[];
};

const round01 = (n: number): number => Math.round(n * 10) / 10;

const keyOf = (
  materialId: string,
  surfaceId: string,
  w: number,
  h: number,
  t: number,
  isIrregular: boolean,
  isFull: boolean,
): string => {
  if (isIrregular) {
    // Irregular pieces never group; ensure uniqueness via piece-specific suffix
    return `irr:${materialId}:${surfaceId}:${w}:${h}:${t}:${Math.random().toString(36).slice(2)}`;
  }
  return `${materialId}:${surfaceId}:${w}:${h}:${t}:${isFull ? 'F' : 'C'}`;
};

export const buildCutList = (project: Project): MaterialCutListItem[] => {
  const items = new Map<string, MaterialCutListItem>();
  for (const layout of project.materialLayouts) {
    const material = project.materials.find((m) => m.id === layout.materialId);
    const surface = project.surfaces.find((s) => s.id === layout.surfaceId);
    if (!material || !surface) continue;
    for (const piece of layout.pieces) {
      const w = round01(piece.boundingWidthMm);
      const h = round01(piece.boundingHeightMm);
      const t = round01(piece.thicknessMm);
      const hasOverlap = piece.overlapPolygons.length > 0;
      const key = keyOf(material.id, surface.id, w, h, t, piece.isIrregular, piece.isFullUnit);
      let item = items.get(key);
      if (!item) {
        item = {
          materialId: material.id,
          materialName: material.name,
          surfaceId: surface.id,
          surfaceName: surface.name,
          widthMm: w,
          heightMm: h,
          thicknessMm: t,
          quantity: 0,
          pieceCodes: [],
          isFullUnit: piece.isFullUnit,
          isRectangularCut: piece.isCutPiece && !piece.isIrregular,
          isIrregularCut: piece.isIrregular,
          overlapIncluded: hasOverlap,
          notes: [],
        };
        items.set(key, item);
      }
      item.quantity += 1;
      item.pieceCodes.push(piece.pieceCode);
      if (!piece.isFullUnit) item.isFullUnit = false;
      if (piece.isIrregular) item.isIrregularCut = true;
      if (hasOverlap) item.overlapIncluded = true;
    }
  }
  const list = Array.from(items.values());
  for (const it of list) {
    if (it.isIrregularCut) it.notes.push('Cut by template');
    else if (it.isFullUnit) it.notes.push('Full units');
    else if (it.isRectangularCut) it.notes.push('Rectangular cut');
    if (it.overlapIncluded) it.notes.push('Includes overlap');
  }
  list.sort((a, b) => {
    if (a.surfaceId !== b.surfaceId) {
      return project.surfaces.findIndex((s) => s.id === a.surfaceId) - project.surfaces.findIndex((s) => s.id === b.surfaceId);
    }
    if (a.isFullUnit !== b.isFullUnit) return a.isFullUnit ? -1 : 1;
    if (a.widthMm !== b.widthMm) return b.widthMm - a.widthMm;
    return b.heightMm - a.heightMm;
  });
  return list;
};
