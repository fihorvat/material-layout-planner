import type { Material, Project } from '@/types';
import { defaultMaterialStyle } from '@/types';
import { newMaterialId } from '@/domain/ids';

export type CreateMaterialInput = {
  name: string;
  unitWidthMm: number;
  unitHeightMm: number;
} & Partial<Material>;

export const createMaterial = (input: CreateMaterialInput): Material => ({
  id: input.id ?? newMaterialId(),
  name: input.name,
  unitWidthMm: input.unitWidthMm,
  unitHeightMm: input.unitHeightMm,
  thicknessMm: input.thicknessMm ?? 10,
  defaultOrientation: input.defaultOrientation ?? 'horizontal',
  defaultJointMm: input.defaultJointMm ?? 3,
  minPieceWidthMm: input.minPieceWidthMm ?? 30,
  minPieceHeightMm: input.minPieceHeightMm ?? 30,
  style: input.style ?? defaultMaterialStyle(),
});

export const cloneMaterial = (m: Material, overrides?: Partial<Material>): Material => ({
  ...m,
  ...overrides,
  id: overrides?.id ?? newMaterialId(),
});

export const materialUnitAreaMm2 = (m: Material): number =>
  m.unitWidthMm * m.unitHeightMm;

export const isMaterialUsed = (project: Project, materialId: string): boolean =>
  project.surfaces.some((s) => s.materialId === materialId) ||
  project.materialLayouts.some((l) => l.materialId === materialId);

export const surfacesUsingMaterial = (project: Project, materialId: string): string[] =>
  project.surfaces.filter((s) => s.materialId === materialId).map((s) => s.id);
