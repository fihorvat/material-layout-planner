import { describe, it, expect, beforeEach } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { createProjectRepository } from '../projectRepository';
import { resetDbConnectionForTests } from '../indexedDb';
import { createEmptyProject } from '@/types';
import { newProjectId, newSurfaceId } from '@/domain/ids';
import type { Project, Surface } from '@/types';
import { defaultSurfaceStyle } from '@/types';

const makeProject = (overrides: Partial<Project> = {}): Project => {
  const now = new Date().toISOString();
  return {
    ...createEmptyProject('Test', { id: newProjectId(), now }),
    ...overrides,
  };
};

const makeSurface = (): Surface => ({
  id: newSurfaceId(),
  name: 'S',
  outerBoundary: [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
    { x: 0, y: 100 },
  ],
  holes: [],
  materialId: null,
  placementPatternId: null,
  edgeRules: [],
  connections: [],
  showName: true,
  showDimensions: true,
  showArea: true,
  style: defaultSurfaceStyle(),
});

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
  resetDbConnectionForTests();
});

describe('projectRepository', () => {
  it('saves, lists, and retrieves a project', async () => {
    const repo = createProjectRepository();
    const project = makeProject({ name: 'Alpha' });
    await repo.saveProject(project);

    const list = await repo.listProjects();
    expect(list).toHaveLength(1);
    expect(list[0]?.name).toBe('Alpha');

    const loaded = await repo.getProject(project.id);
    expect(loaded).toEqual(project);
  });

  it('returns null for missing project id', async () => {
    const repo = createProjectRepository();
    expect(await repo.getProject('missing')).toBeNull();
  });

  it('rejects invalid project data on save', async () => {
    const repo = createProjectRepository();
    const bad = { ...makeProject(), name: '' };
    await expect(repo.saveProject(bad as Project)).rejects.toBeDefined();
  });

  it('lists surfaceCount and materialCount in summaries', async () => {
    const repo = createProjectRepository();
    const project = makeProject({ surfaces: [makeSurface()] });
    await repo.saveProject(project);
    const list = await repo.listProjects();
    expect(list[0]?.surfaceCount).toBe(1);
    expect(list[0]?.materialCount).toBe(0);
  });

  it('duplicateProject creates a new id, new timestamps, and stores it', async () => {
    const repo = createProjectRepository();
    const original = makeProject({ name: 'Source' });
    await repo.saveProject(original);

    await new Promise((r) => setTimeout(r, 5));
    const copy = await repo.duplicateProject(original.id, 'Source (copy)');

    expect(copy.id).not.toBe(original.id);
    expect(copy.name).toBe('Source (copy)');
    expect(copy.createdAt > original.createdAt).toBe(true);
    expect(copy.surfaces).toEqual(original.surfaces);

    const list = await repo.listProjects();
    expect(list).toHaveLength(2);
  });

  it('deleteProject removes the project, its thumbnail, and its blobs', async () => {
    const repo = createProjectRepository();
    const project = makeProject({ name: 'ToDelete' });
    await repo.saveProject(project);

    await repo.putThumbnail(project.id, new Blob(['x']));
    await repo.putBlob(`bg:${project.id}:img1`, new Blob(['y']));
    await repo.putBlob(`bg:${project.id}:img2`, new Blob(['z']));
    await repo.putBlob('bg:otherProject:img1', new Blob(['unrelated']));

    await repo.deleteProject(project.id);

    expect(await repo.getProject(project.id)).toBeNull();
    expect(await repo.getThumbnail(project.id)).toBeNull();
    expect(await repo.getBlob(`bg:${project.id}:img1`)).toBeNull();
    expect(await repo.getBlob(`bg:${project.id}:img2`)).toBeNull();
    expect(await repo.getBlob('bg:otherProject:img1')).not.toBeNull();
  });

  it('round-trips blobs', async () => {
    const repo = createProjectRepository();
    await repo.putBlob('k', new Blob(['hello']));
    const back = await repo.getBlob('k');
    expect(back).not.toBeNull();
    expect(await back!.text()).toBe('hello');
  });
});
