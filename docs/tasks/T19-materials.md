# T19 — Materials (model, editor, list)

- **Milestone**: M4
- **Depends on**: T15
- **Status**: todo

## Goal

Implement material management: create/edit/delete materials, assign a single material to each surface, and surface a material list in the bottom panel. Materials are abstract — no built-in stone/tile assumptions.

## Files

```
src/features/materials/MaterialList.tsx           (bottom-panel content)
src/features/materials/MaterialEditor.tsx         (modal dialog)
src/features/materials/MaterialProperties.tsx     (right-panel content when material selected)
src/features/materials/AssignMaterialControl.tsx  (dropdown used inside SurfaceProperties)
src/domain/materials/material.ts                  (factory + helpers)
src/domain/materials/__tests__/material.test.ts
src/domain/commands/builtin/materialCommands.ts
```

## Material helpers — `material.ts`

```ts
export const createMaterial = (input: Partial<Material> & { name: string; unitWidthMm: number; unitHeightMm: number }): Material;
export const cloneMaterial = (m: Material, overrides?: Partial<Material>): Material;
export const materialUnitAreaMm2 = (m: Material): number;
export const isMaterialUsed = (project: Project, materialId: string): boolean;
```

Defaults from `defaults.ts`:

```ts
{
  thicknessMm: 10,
  defaultOrientation: 'horizontal',
  defaultJointMm: 3,
  minPieceWidthMm: 30,
  minPieceHeightMm: 30,
  style: defaultMaterialStyle(),
}
```

## Commands

```ts
addMaterialCommand({ material: Material });
updateMaterialCommand({ id, patch: Partial<Material> });
deleteMaterialCommand({ id });        // forbidden if material is assigned to any surface — return error from apply()
assignMaterialCommand({ surfaceId, materialId: string | null });
```

`deleteMaterialCommand` returns an error result rather than mutating when in use; the UI catches and displays the error. (Use a discriminated return type if needed.)

## `MaterialEditor`

Modal dialog with fields from plan §40.3:

- Name (text)
- Unit width (length input, `parseLength`)
- Unit height (length input)
- Thickness (length input)
- Default orientation (radio: horizontal / vertical)
- Default joint/gap (length input)
- Minimum piece width (length input)
- Minimum piece height (length input)
- Material fill color (color)
- Label color (color)
- Joint color (color)
- Optional texture (file input → embed as data URL inside `style.textureDataUrl` — keep < 50 KB, warn otherwise) — *Texture is post-MVP visual nicety; field hidden behind an "Advanced" toggle.*

Validation:

- `unitWidthMm > 0`, `unitHeightMm > 0`, `thicknessMm > 0`.
- `minPieceWidthMm <= unitWidthMm`, `minPieceHeightMm <= unitHeightMm`.
- Name unique among materials.

## `MaterialList`

Bottom-panel "Materials" tab. Columns: Name, Unit size (`W × H × T mm`), Default joint, Used by (count of surfaces), Edit, Delete. "Add material" button at the top.

## `AssignMaterialControl`

Combo box rendered inside `SurfaceProperties`. Lists existing materials and "Create new…" item that opens `MaterialEditor`. On change, dispatches `assignMaterialCommand`.

## Implementation steps

1. Build helpers + tests.
2. Build commands + tests:
   - Deleting an in-use material returns error result and does not mutate.
   - Assigning then unassigning material is reflected on `surface.materialId`.
3. Build editor, list, and assign control.
4. Wire into editor shell.

## Decisions

- **One material per surface** is enforced by the schema (`Surface.materialId: string | null`). Use the split tool (T17) if more materials are needed.
- **Textures are optional** and post-MVP visual. Layout engine ignores textures; only fill color is used in the renderer.
- **Deleting a used material** is blocked; UI shows the list of surfaces using it.

## Open questions

_(none)_

## Acceptance criteria

- [ ] User can create, edit, delete materials.
- [ ] Deleting an in-use material is blocked with a clear message and link to using surfaces.
- [ ] Material can be assigned to a surface; surface shows the material color when fill is enabled.
- [ ] Material list shows usage count.
- [ ] All commands undo/redo correctly.
- [ ] Tests pass.

## Verification

```
npm test -- src/domain/materials src/features/materials
```

## Progress Log

_(append entries here)_
