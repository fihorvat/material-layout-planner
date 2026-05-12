import type { BackgroundImageRef, Point2D, Project } from '@/types';
import type { Command, CommandFactory } from '../types';
import { newCommandId } from '@/domain/ids';
import { registerCommand } from '../registry';

export type AddBackgroundImagePayload = { image: BackgroundImageRef };
export type RemoveBackgroundImagePayload = { id: string };
export type UpdateBackgroundImagePayload = { id: string; patch: Partial<BackgroundImageRef> };
export type CalibrateBackgroundImagePayload = {
  id: string;
  scaleMmPerPx: number;
  position: Point2D;
  calibration: NonNullable<BackgroundImageRef['calibration']>;
};

const reinsert = (
  payload: { image: BackgroundImageRef; index: number },
  label: string,
): Command<{ image: BackgroundImageRef; index: number }> => ({
  id: newCommandId(),
  type: 'reinsertBackgroundImage',
  label,
  payload,
  apply: (p: Project) => {
    const next = p.backgroundImages.slice();
    next.splice(Math.min(Math.max(payload.index, 0), next.length), 0, payload.image);
    return { ...p, backgroundImages: next };
  },
  invert: () => removeBackgroundImageCommand({ id: payload.image.id }, `Undo ${label}`),
});

const remove = (
  payload: RemoveBackgroundImagePayload,
  label = 'Remove background image',
): Command<RemoveBackgroundImagePayload> => ({
  id: newCommandId(),
  type: 'removeBackgroundImage',
  label,
  payload,
  apply: (p: Project) => ({ ...p, backgroundImages: p.backgroundImages.filter((x) => x.id !== payload.id) }),
  invert: (prev: Project) => {
    const idx = prev.backgroundImages.findIndex((x) => x.id === payload.id);
    const img = prev.backgroundImages[idx];
    if (!img) throw new Error(`removeBackgroundImage: ${payload.id} not found`);
    return reinsert({ image: img, index: idx }, 'Restore background image');
  },
});

const add = (
  payload: AddBackgroundImagePayload,
  label = 'Add background image',
): Command<AddBackgroundImagePayload> => ({
  id: newCommandId(),
  type: 'addBackgroundImage',
  label,
  payload,
  apply: (p: Project) => ({ ...p, backgroundImages: [...p.backgroundImages, payload.image] }),
  invert: () => removeBackgroundImageCommand({ id: payload.image.id }, `Undo ${label}`),
});

const update = (
  payload: UpdateBackgroundImagePayload,
  label = 'Update background image',
): Command<UpdateBackgroundImagePayload> => ({
  id: newCommandId(),
  type: 'updateBackgroundImage',
  label,
  payload,
  apply: (p: Project) => ({
    ...p,
    backgroundImages: p.backgroundImages.map((x) => (x.id === payload.id ? { ...x, ...payload.patch } : x)),
  }),
  invert: (prev: Project) => {
    const original = prev.backgroundImages.find((x) => x.id === payload.id);
    if (!original) throw new Error(`updateBackgroundImage: ${payload.id} not found`);
    const inv: Record<string, unknown> = {};
    for (const k of Object.keys(payload.patch)) {
      inv[k] = (original as unknown as Record<string, unknown>)[k];
    }
    return updateBackgroundImageCommand(
      { id: payload.id, patch: inv as Partial<BackgroundImageRef> },
      `Undo ${label}`,
    );
  },
});

const calibrate = (
  payload: CalibrateBackgroundImagePayload,
  label = 'Calibrate background image',
): Command<CalibrateBackgroundImagePayload> =>
  update(
    {
      id: payload.id,
      patch: {
        scaleMmPerPx: payload.scaleMmPerPx,
        position: payload.position,
        calibration: payload.calibration,
      },
    },
    label,
  ) as unknown as Command<CalibrateBackgroundImagePayload>;

export const addBackgroundImageCommand: CommandFactory<AddBackgroundImagePayload> = add;
export const removeBackgroundImageCommand: CommandFactory<RemoveBackgroundImagePayload> = remove;
export const updateBackgroundImageCommand: CommandFactory<UpdateBackgroundImagePayload> = update;
export const calibrateBackgroundImageCommand: CommandFactory<CalibrateBackgroundImagePayload> = calibrate;

registerCommand('addBackgroundImage', addBackgroundImageCommand);
registerCommand('removeBackgroundImage', removeBackgroundImageCommand);
registerCommand('updateBackgroundImage', updateBackgroundImageCommand);
registerCommand('calibrateBackgroundImage', calibrateBackgroundImageCommand);
registerCommand('reinsertBackgroundImage', reinsert as unknown as CommandFactory<unknown>);
