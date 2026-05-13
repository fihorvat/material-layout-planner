import type { Project } from '@/types';
import type { Command, CommandFactory } from '../types';
import { newCommandId } from '@/domain/ids';

type ReplaceProjectPayload = { next: Project };

const make = (payload: ReplaceProjectPayload, label = 'Replace project'): Command<ReplaceProjectPayload> => ({
  id: newCommandId(),
  type: 'replaceProject',
  label,
  payload,
  apply: () => payload.next,
  invert: (prev: Project) => make({ next: prev }, 'Undo replace project'),
});

export const replaceProjectCommand: CommandFactory<ReplaceProjectPayload> = make;
