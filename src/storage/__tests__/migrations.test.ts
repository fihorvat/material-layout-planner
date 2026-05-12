import { describe, it, expect } from 'vitest';
import { CURRENT_SCHEMA_VERSION, migrateProject, MigrationError } from '../migrations';
import { createEmptyProject } from '@/types';
import { newProjectId } from '@/domain/ids';

describe('migrations', () => {
  it('CURRENT_SCHEMA_VERSION is 1', () => {
    expect(CURRENT_SCHEMA_VERSION).toBe(1);
  });

  it('passes a current-version project through validation', () => {
    const project = createEmptyProject('Migr', {
      id: newProjectId(),
      now: new Date().toISOString(),
    });
    expect(migrateProject(project)).toEqual(project);
  });

  it('throws MigrationError when schemaVersion is missing', () => {
    expect(() => migrateProject({ name: 'x' })).toThrow(MigrationError);
  });

  it('throws MigrationError when schemaVersion is newer than supported', () => {
    const project = createEmptyProject('Future', {
      id: newProjectId(),
      now: new Date().toISOString(),
    });
    const futured = { ...project, schemaVersion: 99 };
    expect(() => migrateProject(futured)).toThrow(MigrationError);
  });
});
