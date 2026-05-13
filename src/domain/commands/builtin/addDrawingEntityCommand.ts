import type { DrawingEntity, Project } from '@/types';
import type { Command, CommandFactory } from '../types';
import { newCommandId } from '@/domain/ids';
import { deleteDrawingEntityCommand } from './deleteDrawingEntityCommand';

type AddDrawingEntityPayload = { entity: DrawingEntity };

const make = (
  payload: AddDrawingEntityPayload,
  label = `Add ${payload.entity.type}`,
): Command<AddDrawingEntityPayload> => ({
  id: newCommandId(),
  type: 'addDrawingEntity',
  label,
  payload,
  apply: (project: Project) => ({
    ...project,
    drawingEntities: [...project.drawingEntities, payload.entity],
  }),
  invert: () => deleteDrawingEntityCommand({ id: payload.entity.id }, `Undo ${label}`),
});

export const addDrawingEntityCommand: CommandFactory<AddDrawingEntityPayload> = make;
