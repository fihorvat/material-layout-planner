import type { Point2D } from '@/types';
import { useProjectStore, useSelectionStore, useOpeningToolStore } from '@/state';
import { useToastStore } from '@/state/toastStore';
import { ensureCW, validatePolygon } from '@/domain/geometry';
import {
  dispatchCommand,
  addOpeningCommand,
  deleteDrawingEntityCommand,
} from '@/domain/commands';
import { validateOpening, findEnclosingSurface } from './openingValidation';
import { noEnclosingSurfaceMessage } from './noEnclosingSurfaceMessage';

const rectanglePolygon = (origin: Point2D, w: number, h: number): Point2D[] => [
  { x: origin.x, y: origin.y },
  { x: origin.x + w, y: origin.y },
  { x: origin.x + w, y: origin.y + h },
  { x: origin.x, y: origin.y + h },
];

/**
 * Convert the currently selected rectangle or polygon drawing entity into an
 * opening on the surface that contains its first vertex. Pushes a toast on
 * failure and returns false; on success dispatches addOpening + deleteEntity.
 */
export const commitOpeningFromSelection = (): boolean => {
  const sel = useSelectionStore.getState().selected;
  const project = useProjectStore.getState().project;
  const entry = sel.find((e) => e.kind === 'rectangle' || e.kind === 'polygon');
  if (!entry) {
    useToastStore
      .getState()
      .pushToast('Select a rectangle or polygon to convert into an opening', 'warning');
    return false;
  }
  const entity = project.drawingEntities.find((e) => e.id === entry.id);
  if (!entity) return false;
  let polygon: Point2D[];
  if (entity.type === 'rectangle') {
    polygon = rectanglePolygon(entity.origin, entity.widthMm, entity.heightMm);
  } else if (entity.type === 'polygon') {
    polygon = entity.points;
  } else {
    return false;
  }
  const polyVal = validatePolygon(polygon);
  if (!polyVal.valid) {
    useToastStore
      .getState()
      .pushToast(
        `Invalid opening: ${polyVal.issues.map((i) => i.code).join(', ')}`,
        'error',
      );
    return false;
  }
  const reference = polygon[0]!;
  const parent = findEnclosingSurface(project.surfaces, reference);
  if (!parent) {
    useToastStore
      .getState()
      .pushToast(noEnclosingSurfaceMessage(project, reference), 'error');
    return false;
  }
  const normalized = ensureCW(polygon);
  const validation = validateOpening(parent, normalized);
  if (!validation.valid) {
    useToastStore
      .getState()
      .pushToast(
        `Opening invalid: ${validation.issues.map((i) => i.message || i.code).join('; ')}`,
        'error',
      );
    return false;
  }
  const tool = useOpeningToolStore.getState();
  dispatchCommand(
    addOpeningCommand({
      surfaceId: parent.id,
      hole: normalized,
      meta: { showDimensions: tool.showDimensions, style: tool.style },
    }),
  );
  try {
    dispatchCommand(deleteDrawingEntityCommand({ id: entity.id }));
  } catch {
    // best-effort: opening was added even if entity deletion fails.
  }
  useSelectionStore.getState().clear();
  return true;
};
