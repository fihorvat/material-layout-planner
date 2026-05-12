import { describe, it, expect } from 'vitest';
import {
  exportProjectToJson,
  parseProjectFromJson,
  projectJsonFileName,
  ProjectImportError,
} from '../jsonImportExport';
import { createEmptyProject } from '@/types';
import { newProjectId } from '@/domain/ids';

const makeProject = () =>
  createEmptyProject('Round Trip', {
    id: newProjectId(),
    now: new Date().toISOString(),
  });

describe('jsonImportExport', () => {
  it('exports then imports yielding deep equal project', async () => {
    const project = makeProject();
    const blob = exportProjectToJson(project);
    const text = await blob.text();
    const back = parseProjectFromJson(text);
    expect(back).toEqual(project);
  });

  it('export produces pretty-printed JSON', async () => {
    const project = makeProject();
    const blob = exportProjectToJson(project);
    const text = await blob.text();
    expect(text).toContain('\n');
    expect(text).toContain('  ');
  });

  it('throws ProjectImportError on malformed JSON', () => {
    expect(() => parseProjectFromJson('{not json')).toThrowError(ProjectImportError);
  });

  it('throws ProjectImportError on invalid schema', () => {
    expect(() => parseProjectFromJson('{"schemaVersion":1,"foo":1}')).toThrowError(
      ProjectImportError,
    );
  });

  it('throws ProjectImportError when schemaVersion is missing', () => {
    expect(() => parseProjectFromJson('{"name":"x"}')).toThrowError(ProjectImportError);
  });

  it('builds a slugified, suffixed filename', () => {
    const project = makeProject();
    project.name = 'Hello World!';
    const name = projectJsonFileName(project);
    expect(name.startsWith('hello-world-')).toBe(true);
    expect(name.endsWith('.mlp.json')).toBe(true);
  });
});
