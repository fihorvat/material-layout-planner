import type { Material, Project } from '@/types';
import type { Command, CommandFactory } from '../types';
import { newCommandId } from '@/domain/ids';
import { registerCommand } from '../registry';
import { isMaterialUsed } from '@/domain/materials/material';

export type AddMaterialPayload = { material: Material };
export type DeleteMaterialPayload = { id: string };
export type UpdateMaterialPayload = { id: string; patch: Partial<Material> };
export type AssignMaterialPayload = { surfaceId: string; materialId: string | null };

export class MaterialInUseError extends Error {
  readonly code = 'materialInUse';
}

const reinsertMaterial = (
  payload: { material: Material; index: number },
  label: string,
): Command<{ material: Material; index: number }> => ({
  id: newCommandId(),
  type: 'reinsertMaterial',
  label,
  payload,
  apply: (p: Project) => {
    const next = p.materials.slice();
    next.splice(Math.min(Math.max(payload.index, 0), next.length), 0, payload.material);
    return { ...p, materials: next };
  },
  invert: () => deleteMaterialCommand({ id: payload.material.id }, `Undo ${label}`),
});

const deleteMaterial = (
  payload: DeleteMaterialPayload,
  label = 'Delete material',
): Command<DeleteMaterialPayload> => ({
  id: newCommandId(),
  type: 'deleteMaterial',
  label,
  payload,
  apply: (p: Project) => {
    if (isMaterialUsed(p, payload.id)) {
      throw new MaterialInUseError(`Material ${payload.id} is in use; unassign first`);
    }
    return { ...p, materials: p.materials.filter((m) => m.id !== payload.id) };
  },
  invert: (prev: Project) => {
    const idx = prev.materials.findIndex((m) => m.id === payload.id);
    const m = prev.materials[idx];
    if (!m) throw new Error(`deleteMaterial: ${payload.id} not found`);
    return reinsertMaterial({ material: m, index: idx }, 'Restore material');
  },
});

const addMaterial = (
  payload: AddMaterialPayload,
  label = `Add material ${payload.material.name}`,
): Command<AddMaterialPayload> => ({
  id: newCommandId(),
  type: 'addMaterial',
  label,
  payload,
  apply: (p: Project) => ({ ...p, materials: [...p.materials, payload.material] }),
  invert: () => deleteMaterialCommand({ id: payload.material.id }, `Undo ${label}`),
});

const updateMaterial = (
  payload: UpdateMaterialPayload,
  label = 'Update material',
): Command<UpdateMaterialPayload> => ({
  id: newCommandId(),
  type: 'updateMaterial',
  label,
  payload,
  apply: (p: Project) => ({
    ...p,
    materials: p.materials.map((m) => (m.id === payload.id ? { ...m, ...payload.patch } : m)),
  }),
  invert: (prev: Project) => {
    const original = prev.materials.find((m) => m.id === payload.id);
    if (!original) throw new Error(`updateMaterial: ${payload.id} not found`);
    const inv: Record<string, unknown> = {};
    for (const k of Object.keys(payload.patch)) {
      inv[k] = (original as unknown as Record<string, unknown>)[k];
    }
    return updateMaterialCommand({ id: payload.id, patch: inv as Partial<Material> }, `Undo ${label}`);
  },
});

const assignMaterial = (
  payload: AssignMaterialPayload,
  label = 'Assign material',
): Command<AssignMaterialPayload> => ({
  id: newCommandId(),
  type: 'assignMaterial',
  label,
  payload,
  apply: (p: Project) => ({
    ...p,
    surfaces: p.surfaces.map((s) =>
      s.id === payload.surfaceId ? { ...s, materialId: payload.materialId } : s,
    ),
  }),
  invert: (prev: Project) => {
    const s = prev.surfaces.find((x) => x.id === payload.surfaceId);
    if (!s) throw new Error('assignMaterial: surface not found');
    return assignMaterialCommand(
      { surfaceId: payload.surfaceId, materialId: s.materialId },
      `Undo ${label}`,
    );
  },
});

export const addMaterialCommand: CommandFactory<AddMaterialPayload> = addMaterial;
export const deleteMaterialCommand: CommandFactory<DeleteMaterialPayload> = deleteMaterial;
export const updateMaterialCommand: CommandFactory<UpdateMaterialPayload> = updateMaterial;
export const assignMaterialCommand: CommandFactory<AssignMaterialPayload> = assignMaterial;

registerCommand('addMaterial', addMaterialCommand);
registerCommand('deleteMaterial', deleteMaterialCommand);
registerCommand('updateMaterial', updateMaterialCommand);
registerCommand('assignMaterial', assignMaterialCommand);
registerCommand('reinsertMaterial', reinsertMaterial as unknown as CommandFactory<unknown>);
