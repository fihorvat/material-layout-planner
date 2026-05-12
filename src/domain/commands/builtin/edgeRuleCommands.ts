import type { EdgeRule, Project } from '@/types';
import type { Command, CommandFactory } from '../types';
import { newCommandId } from '@/domain/ids';
import { registerCommand } from '../registry';

export type AddEdgeRulePayload = { surfaceId: string; rule: EdgeRule };
export type UpdateEdgeRulePayload = { surfaceId: string; edgeIndex: number; patch: Partial<EdgeRule> };
export type RemoveEdgeRulePayload = { surfaceId: string; edgeIndex: number };

const addEdgeRule = (
  payload: AddEdgeRulePayload,
  label = 'Add edge rule',
): Command<AddEdgeRulePayload> => ({
  id: newCommandId(),
  type: 'addEdgeRule',
  label,
  payload,
  apply: (p: Project) => ({
    ...p,
    surfaces: p.surfaces.map((s) =>
      s.id === payload.surfaceId
        ? {
            ...s,
            edgeRules: [
              ...s.edgeRules.filter((r) => r.edgeIndex !== payload.rule.edgeIndex),
              payload.rule,
            ],
          }
        : s,
    ),
  }),
  invert: (prev: Project) => {
    const s = prev.surfaces.find((x) => x.id === payload.surfaceId);
    if (!s) throw new Error('addEdgeRule: surface not found');
    const original = s.edgeRules.find((r) => r.edgeIndex === payload.rule.edgeIndex);
    if (original) {
      return addEdgeRuleCommand({ surfaceId: payload.surfaceId, rule: original }, `Undo ${label}`);
    }
    return removeEdgeRuleCommand(
      { surfaceId: payload.surfaceId, edgeIndex: payload.rule.edgeIndex },
      `Undo ${label}`,
    );
  },
});

const removeEdgeRule = (
  payload: RemoveEdgeRulePayload,
  label = 'Remove edge rule',
): Command<RemoveEdgeRulePayload> => ({
  id: newCommandId(),
  type: 'removeEdgeRule',
  label,
  payload,
  apply: (p: Project) => ({
    ...p,
    surfaces: p.surfaces.map((s) =>
      s.id === payload.surfaceId
        ? { ...s, edgeRules: s.edgeRules.filter((r) => r.edgeIndex !== payload.edgeIndex) }
        : s,
    ),
  }),
  invert: (prev: Project) => {
    const s = prev.surfaces.find((x) => x.id === payload.surfaceId);
    const rule = s?.edgeRules.find((r) => r.edgeIndex === payload.edgeIndex);
    if (!s || !rule) throw new Error('removeEdgeRule: rule not found');
    return addEdgeRuleCommand({ surfaceId: payload.surfaceId, rule }, `Undo ${label}`);
  },
});

const updateEdgeRule = (
  payload: UpdateEdgeRulePayload,
  label = 'Update edge rule',
): Command<UpdateEdgeRulePayload> => ({
  id: newCommandId(),
  type: 'updateEdgeRule',
  label,
  payload,
  apply: (p: Project) => ({
    ...p,
    surfaces: p.surfaces.map((s) =>
      s.id === payload.surfaceId
        ? {
            ...s,
            edgeRules: s.edgeRules.map((r) =>
              r.edgeIndex === payload.edgeIndex ? { ...r, ...payload.patch } : r,
            ),
          }
        : s,
    ),
  }),
  invert: (prev: Project) => {
    const s = prev.surfaces.find((x) => x.id === payload.surfaceId);
    const rule = s?.edgeRules.find((r) => r.edgeIndex === payload.edgeIndex);
    if (!s || !rule) throw new Error('updateEdgeRule: rule not found');
    const inv: Record<string, unknown> = {};
    for (const k of Object.keys(payload.patch)) {
      inv[k] = (rule as unknown as Record<string, unknown>)[k];
    }
    return updateEdgeRuleCommand(
      { surfaceId: payload.surfaceId, edgeIndex: payload.edgeIndex, patch: inv as Partial<EdgeRule> },
      `Undo ${label}`,
    );
  },
});

export const addEdgeRuleCommand: CommandFactory<AddEdgeRulePayload> = addEdgeRule;
export const removeEdgeRuleCommand: CommandFactory<RemoveEdgeRulePayload> = removeEdgeRule;
export const updateEdgeRuleCommand: CommandFactory<UpdateEdgeRulePayload> = updateEdgeRule;

registerCommand('addEdgeRule', addEdgeRuleCommand);
registerCommand('removeEdgeRule', removeEdgeRuleCommand);
registerCommand('updateEdgeRule', updateEdgeRuleCommand);
