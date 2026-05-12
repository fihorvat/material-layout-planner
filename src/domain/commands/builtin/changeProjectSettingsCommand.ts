import type { Project, ProjectSettings } from '@/types';
import type { Command, CommandFactory } from '../types';
import { newCommandId } from '@/domain/ids';
import { registerCommand } from '../registry';

export type ChangeProjectSettingsPayload = { patch: Partial<ProjectSettings> };

const make = (
  payload: ChangeProjectSettingsPayload,
  label = 'Change project settings',
): Command<ChangeProjectSettingsPayload> => ({
  id: newCommandId(),
  type: 'changeProjectSettings',
  label,
  payload,
  apply: (project: Project) => ({
    ...project,
    settings: { ...project.settings, ...payload.patch },
  }),
  invert: (prev: Project) => {
    const inversePatch: Record<string, unknown> = {};
    for (const key of Object.keys(payload.patch)) {
      inversePatch[key] = (prev.settings as unknown as Record<string, unknown>)[key];
    }
    return make(
      { patch: inversePatch as Partial<ProjectSettings> },
      `Undo ${label}`,
    );
  },
});

export const changeProjectSettingsCommand: CommandFactory<ChangeProjectSettingsPayload> = make;
registerCommand('changeProjectSettings', changeProjectSettingsCommand);
