export {
  openMlpDb,
  resetDbConnectionForTests,
  DB_NAME,
  DB_VERSION,
  type ProjectRecord,
  type MlpDb,
} from './indexedDb';

export {
  createProjectRepository,
  type ProjectRepository,
  type ProjectSummary,
} from './projectRepository';

export {
  CURRENT_SCHEMA_VERSION,
  migrations,
  migrateProject,
  MigrationError,
  type Migration,
} from './migrations';

export {
  exportProjectToJson,
  downloadProjectJson,
  parseProjectFromJson,
  pickAndImportProjectJson,
  projectJsonFileName,
  ProjectImportError,
} from './jsonImportExport';

export { startAutosave, type AutosaveOptions } from './autosave';

export { loadPreferences, savePreferences, type Preferences } from './preferences';
