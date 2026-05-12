import { ProjectSchema, type Project } from '@/types';

export const CURRENT_SCHEMA_VERSION = 1;

export type Migration = {
  from: number;
  to: number;
  migrate: (raw: unknown) => unknown;
};

export const migrations: Migration[] = [];

const hasNumberSchemaVersion = (raw: unknown): raw is { schemaVersion: number } => {
  return (
    typeof raw === 'object' &&
    raw !== null &&
    'schemaVersion' in raw &&
    typeof (raw as { schemaVersion: unknown }).schemaVersion === 'number'
  );
};

export class MigrationError extends Error {
  readonly fromVersion: number;
  readonly toVersion: number;
  constructor(message: string, fromVersion: number, toVersion: number) {
    super(message);
    this.name = 'MigrationError';
    this.fromVersion = fromVersion;
    this.toVersion = toVersion;
  }
}

export const migrateProject = (raw: unknown): Project => {
  if (!hasNumberSchemaVersion(raw)) {
    throw new MigrationError('Missing or invalid schemaVersion', -1, CURRENT_SCHEMA_VERSION);
  }
  let current: unknown = raw;
  let version = (raw as { schemaVersion: number }).schemaVersion;
  while (version < CURRENT_SCHEMA_VERSION) {
    const step = migrations.find((m) => m.from === version);
    if (!step) {
      throw new MigrationError(
        `No migration path from v${version} to v${CURRENT_SCHEMA_VERSION}`,
        version,
        CURRENT_SCHEMA_VERSION,
      );
    }
    current = step.migrate(current);
    version = step.to;
  }
  if (version > CURRENT_SCHEMA_VERSION) {
    throw new MigrationError(
      `Project schemaVersion ${version} is newer than supported ${CURRENT_SCHEMA_VERSION}`,
      version,
      CURRENT_SCHEMA_VERSION,
    );
  }
  return ProjectSchema.parse(current);
};
