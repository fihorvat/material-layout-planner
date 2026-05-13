import type { Project, Surface, SurfaceConnection } from '@/types';
import type { Command, CommandFactory } from '../types';
import { newCommandId } from '@/domain/ids';

type AddConnectionPayload = { connection: SurfaceConnection };
type DeleteConnectionPayload = { id: string };
type UpdateConnectionPayload = { id: string; patch: Partial<SurfaceConnection> };

const addRefToSurface = (s: Surface, connectionId: string): Surface =>
  s.connections.some((c) => c.connectionId === connectionId)
    ? s
    : { ...s, connections: [...s.connections, { connectionId }] };

const removeRefFromSurface = (s: Surface, connectionId: string): Surface => ({
  ...s,
  connections: s.connections.filter((c) => c.connectionId !== connectionId),
});

const reinsertConnection = (
  payload: { connection: SurfaceConnection; index: number },
  label: string,
): Command<{ connection: SurfaceConnection; index: number }> => ({
  id: newCommandId(),
  type: 'reinsertConnection',
  label,
  payload,
  apply: (p: Project) => {
    const next = p.surfaceConnections.slice();
    next.splice(Math.min(Math.max(payload.index, 0), next.length), 0, payload.connection);
    const surfaces = p.surfaces.map((s) => {
      if (s.id === payload.connection.surfaceAId || s.id === payload.connection.surfaceBId) {
        return addRefToSurface(s, payload.connection.id);
      }
      return s;
    });
    return { ...p, surfaceConnections: next, surfaces };
  },
  invert: () => deleteConnectionCommand({ id: payload.connection.id }, `Undo ${label}`),
});

const deleteConnection = (
  payload: DeleteConnectionPayload,
  label = 'Delete connection',
): Command<DeleteConnectionPayload> => ({
  id: newCommandId(),
  type: 'deleteConnection',
  label,
  payload,
  apply: (p: Project) => ({
    ...p,
    surfaceConnections: p.surfaceConnections.filter((c) => c.id !== payload.id),
    surfaces: p.surfaces.map((s) => removeRefFromSurface(s, payload.id)),
  }),
  invert: (prev: Project) => {
    const idx = prev.surfaceConnections.findIndex((c) => c.id === payload.id);
    const c = prev.surfaceConnections[idx];
    if (!c) throw new Error(`deleteConnection: ${payload.id} not found`);
    return reinsertConnection({ connection: c, index: idx }, 'Restore connection');
  },
});

const addConnection = (
  payload: AddConnectionPayload,
  label = 'Add connection',
): Command<AddConnectionPayload> => ({
  id: newCommandId(),
  type: 'addConnection',
  label,
  payload,
  apply: (p: Project) => ({
    ...p,
    surfaceConnections: [...p.surfaceConnections, payload.connection],
    surfaces: p.surfaces.map((s) => {
      if (s.id === payload.connection.surfaceAId || s.id === payload.connection.surfaceBId) {
        return addRefToSurface(s, payload.connection.id);
      }
      return s;
    }),
  }),
  invert: () => deleteConnectionCommand({ id: payload.connection.id }, `Undo ${label}`),
});

const updateConnection = (
  payload: UpdateConnectionPayload,
  label = 'Update connection',
): Command<UpdateConnectionPayload> => ({
  id: newCommandId(),
  type: 'updateConnection',
  label,
  payload,
  apply: (p: Project) => ({
    ...p,
    surfaceConnections: p.surfaceConnections.map((c) =>
      c.id === payload.id ? { ...c, ...payload.patch } : c,
    ),
  }),
  invert: (prev: Project) => {
    const original = prev.surfaceConnections.find((c) => c.id === payload.id);
    if (!original) throw new Error(`updateConnection: ${payload.id} not found`);
    const inv: Record<string, unknown> = {};
    for (const k of Object.keys(payload.patch)) {
      inv[k] = (original as unknown as Record<string, unknown>)[k];
    }
    return updateConnectionCommand({ id: payload.id, patch: inv as Partial<SurfaceConnection> }, `Undo ${label}`);
  },
});

export const addConnectionCommand: CommandFactory<AddConnectionPayload> = addConnection;
export const deleteConnectionCommand: CommandFactory<DeleteConnectionPayload> = deleteConnection;
export const updateConnectionCommand: CommandFactory<UpdateConnectionPayload> = updateConnection;
