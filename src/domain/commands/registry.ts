import type { CommandFactory } from './types';

const REGISTRY = new Map<string, CommandFactory<unknown>>();

export const registerCommand = <TPayload>(
  type: string,
  factory: CommandFactory<TPayload>,
): void => {
  REGISTRY.set(type, factory as CommandFactory<unknown>);
};

export const getCommandFactory = (type: string): CommandFactory<unknown> | undefined => {
  return REGISTRY.get(type);
};
