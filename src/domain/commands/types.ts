import type { Project } from '@/types';
import type { Command as HistoryCommand } from '@/state';

export type CommandContext = {
  project: Project;
};

export type CommandResult = {
  project: Project;
  inverse: Command;
};

export interface Command<TPayload = unknown> extends HistoryCommand<TPayload> {
  readonly type: string;
}

export type CommandFactory<TPayload> = (payload: TPayload, label?: string) => Command<TPayload>;
