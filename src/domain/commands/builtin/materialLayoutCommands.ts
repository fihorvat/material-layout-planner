import type { MaterialLayout, Project } from '@/types';
import type { Command, CommandFactory } from '../types';
import { newCommandId } from '@/domain/ids';
import { registerCommand } from '../registry';

export type SetMaterialLayoutsPayload = { layouts: MaterialLayout[] };

const setLayouts = (
  payload: SetMaterialLayoutsPayload,
  label = 'Generate material layouts',
): Command<SetMaterialLayoutsPayload> => ({
  id: newCommandId(),
  type: 'setMaterialLayouts',
  label,
  payload,
  apply: (p: Project) => ({ ...p, materialLayouts: payload.layouts }),
  invert: (prev: Project) =>
    setMaterialLayoutsCommand({ layouts: prev.materialLayouts }, `Undo ${label}`),
});

const clearLayouts = (
  _payload: Record<string, never>,
  label = 'Clear material layouts',
): Command<Record<string, never>> => ({
  id: newCommandId(),
  type: 'clearMaterialLayouts',
  label,
  payload: _payload,
  apply: (p: Project) => ({ ...p, materialLayouts: [] }),
  invert: (prev: Project) =>
    setMaterialLayoutsCommand({ layouts: prev.materialLayouts }, `Undo ${label}`),
});

export const setMaterialLayoutsCommand: CommandFactory<SetMaterialLayoutsPayload> = setLayouts;
export const clearMaterialLayoutsCommand: CommandFactory<Record<string, never>> = clearLayouts;

registerCommand('setMaterialLayouts', setMaterialLayoutsCommand);
registerCommand('clearMaterialLayouts', clearMaterialLayoutsCommand);
