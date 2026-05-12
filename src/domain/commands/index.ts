export type { Command, CommandFactory, CommandContext, CommandResult } from './types';
export { registerCommand, getCommandFactory } from './registry';
export { dispatchCommand, undo, redo, canUndo, canRedo } from './dispatcher';
export { replaceProjectCommand } from './builtin/replaceProjectCommand';
export { addDrawingEntityCommand } from './builtin/addDrawingEntityCommand';
export { deleteDrawingEntityCommand } from './builtin/deleteDrawingEntityCommand';
export { updateDrawingEntityCommand } from './builtin/updateDrawingEntityCommand';
export { changeProjectSettingsCommand } from './builtin/changeProjectSettingsCommand';
export {
  addDimensionCommand,
  updateDimensionCommand,
  deleteDimensionCommand,
} from './builtin/dimensionCommands';
export {
  addLabelCommand,
  updateLabelCommand,
  deleteLabelCommand,
} from './builtin/labelCommands';
export {
  createSurfaceCommand,
  updateSurfaceCommand,
  renameSurfaceCommand,
  deleteSurfaceCommand,
  addSurfaceHoleCommand,
  removeSurfaceHoleCommand,
  updateSurfaceHoleCommand,
} from './builtin/surfaceCommands';
export { splitSurfaceCommand } from './builtin/splitSurfaceCommand';
export {
  addConnectionCommand,
  updateConnectionCommand,
  deleteConnectionCommand,
} from './builtin/connectionCommands';
export {
  addMaterialCommand,
  updateMaterialCommand,
  deleteMaterialCommand,
  assignMaterialCommand,
} from './builtin/materialCommands';
export {
  addPlacementPatternCommand,
  updatePlacementPatternCommand,
  deletePlacementPatternCommand,
  assignPlacementPatternCommand,
} from './builtin/placementPatternCommands';
export {
  addEdgeRuleCommand,
  updateEdgeRuleCommand,
  removeEdgeRuleCommand,
} from './builtin/edgeRuleCommands';
export {
  setMaterialLayoutsCommand,
  clearMaterialLayoutsCommand,
} from './builtin/materialLayoutCommands';
export {
  addBackgroundImageCommand,
  removeBackgroundImageCommand,
  updateBackgroundImageCommand,
  calibrateBackgroundImageCommand,
} from './builtin/backgroundImageCommands';
