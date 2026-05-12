import { describe, expect, it, beforeEach } from 'vitest';
import { createMaterial, materialUnitAreaMm2, isMaterialUsed } from '../material';
import { createEmptyProject } from '@/types';
import { useProjectStore, useHistoryStore } from '@/state';
import {
  dispatchCommand,
  addMaterialCommand,
  deleteMaterialCommand,
  assignMaterialCommand,
  updateMaterialCommand,
} from '@/domain/commands';
import { MaterialInUseError } from '@/domain/commands/builtin/materialCommands';
import { createSurface } from '@/domain/surfaces/createSurface';

describe('material domain', () => {
  beforeEach(() => {
    useProjectStore.getState().resetForTests();
    useHistoryStore.getState().resetForTests();
  });

  it('createMaterial fills defaults', () => {
    const m = createMaterial({ name: 'M', unitWidthMm: 600, unitHeightMm: 300 });
    expect(m.thicknessMm).toBe(10);
    expect(m.defaultJointMm).toBe(3);
    expect(materialUnitAreaMm2(m)).toBe(180_000);
  });

  it('isMaterialUsed detects surface assignment', () => {
    const p = createEmptyProject('T');
    const m = createMaterial({ name: 'M', unitWidthMm: 600, unitHeightMm: 300, id: 'mat_X' });
    p.materials.push(m);
    p.surfaces.push({ ...createSurface({ name: 'S', outerBoundary: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }] }), materialId: 'mat_X' });
    expect(isMaterialUsed(p, 'mat_X')).toBe(true);
  });

  it('addMaterial / deleteMaterial roundtrip', () => {
    const m = createMaterial({ name: 'M', unitWidthMm: 600, unitHeightMm: 300 });
    dispatchCommand(addMaterialCommand({ material: m }));
    expect(useProjectStore.getState().project.materials).toHaveLength(1);
    dispatchCommand(deleteMaterialCommand({ id: m.id }));
    expect(useProjectStore.getState().project.materials).toHaveLength(0);
  });

  it('deleting in-use material throws', () => {
    const m = createMaterial({ name: 'M', unitWidthMm: 600, unitHeightMm: 300 });
    dispatchCommand(addMaterialCommand({ material: m }));
    const s = createSurface({ name: 'S', outerBoundary: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }] });
    useProjectStore.setState((st) => ({ ...st, project: { ...st.project, surfaces: [{ ...s, materialId: m.id }] } }));
    expect(() => dispatchCommand(deleteMaterialCommand({ id: m.id }))).toThrow(MaterialInUseError);
  });

  it('assignMaterial sets surface.materialId and inverse restores', () => {
    const m = createMaterial({ name: 'M', unitWidthMm: 600, unitHeightMm: 300 });
    dispatchCommand(addMaterialCommand({ material: m }));
    const s = createSurface({ name: 'S', outerBoundary: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }] });
    useProjectStore.setState((st) => ({ ...st, project: { ...st.project, surfaces: [s] } }));
    dispatchCommand(assignMaterialCommand({ surfaceId: s.id, materialId: m.id }));
    expect(useProjectStore.getState().project.surfaces[0]?.materialId).toBe(m.id);
  });

  it('updateMaterial patch and inverse', () => {
    const m = createMaterial({ name: 'M', unitWidthMm: 600, unitHeightMm: 300 });
    dispatchCommand(addMaterialCommand({ material: m }));
    dispatchCommand(updateMaterialCommand({ id: m.id, patch: { defaultJointMm: 5 } }));
    expect(useProjectStore.getState().project.materials[0]?.defaultJointMm).toBe(5);
  });
});
