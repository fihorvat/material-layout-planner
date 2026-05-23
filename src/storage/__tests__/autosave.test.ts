import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { createProjectRepository } from '../projectRepository';
import type { ProjectRepository } from '../projectRepository';
import { resetDbConnectionForTests } from '../indexedDb';
import { startAutosave } from '../autosave';
import { useProjectStore } from '@/state';
import { newProjectId } from '@/domain/ids';
import { createEmptyProject } from '@/types';

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
  resetDbConnectionForTests();
  useProjectStore.getState().resetForTests();
});

describe('autosave', () => {
  it('debounces multiple rapid mutations into a single save', async () => {
    vi.useFakeTimers();
    const repo = createProjectRepository();
    const saveSpy = vi.spyOn(repo, 'saveProject');

    const stop = startAutosave({ repo, intervalMs: 100 });

    useProjectStore.getState().patchProject((d) => {
      d.name = 'one';
    });
    useProjectStore.getState().patchProject((d) => {
      d.name = 'two';
    });
    useProjectStore.getState().patchProject((d) => {
      d.name = 'three';
    });

    expect(saveSpy).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(150);
    expect(saveSpy).toHaveBeenCalledTimes(1);

    stop();
    vi.useRealTimers();
  });

  it('triggers a second save for a later batch of mutations', async () => {
    vi.useFakeTimers();
    const repo = createProjectRepository();
    const saveSpy = vi.spyOn(repo, 'saveProject');

    const stop = startAutosave({ repo, intervalMs: 50 });

    useProjectStore.getState().patchProject((d) => {
      d.name = 'first';
    });
    await vi.advanceTimersByTimeAsync(80);
    expect(saveSpy).toHaveBeenCalledTimes(1);

    useProjectStore.getState().patchProject((d) => {
      d.name = 'second';
    });
    await vi.advanceTimersByTimeAsync(80);
    expect(saveSpy).toHaveBeenCalledTimes(2);

    stop();
    vi.useRealTimers();
  });

  it('skips saving when enabled() returns false', async () => {
    vi.useFakeTimers();
    const repo = createProjectRepository();
    const saveSpy = vi.spyOn(repo, 'saveProject');

    const stop = startAutosave({ repo, intervalMs: 50, enabled: () => false });

    useProjectStore.getState().patchProject((d) => {
      d.name = 'never';
    });
    await vi.advanceTimersByTimeAsync(200);
    expect(saveSpy).not.toHaveBeenCalled();

    stop();
    vi.useRealTimers();
  });

  it('marks the project as saved after a successful flush', async () => {
    vi.useFakeTimers();
    const repo = createProjectRepository();
    useProjectStore
      .getState()
      .replaceProject(
        createEmptyProject('Auto', { id: newProjectId(), now: new Date().toISOString() }),
      );
    const stop = startAutosave({ repo, intervalMs: 50 });
    useProjectStore.getState().patchProject((d) => {
      d.name = 'dirty';
    });
    expect(useProjectStore.getState().isDirty).toBe(true);
    await vi.advanceTimersByTimeAsync(80);
    expect(useProjectStore.getState().isDirty).toBe(false);
    expect(useProjectStore.getState().lastSavedAt).not.toBeNull();
    stop();
    vi.useRealTimers();
  });

  it('stores a thumbnail when autosave capture succeeds', async () => {
    vi.useFakeTimers();
    const repo = {
      listProjects: vi.fn(),
      getProject: vi.fn(),
      saveProject: vi.fn().mockResolvedValue(undefined),
      deleteProject: vi.fn(),
      duplicateProject: vi.fn(),
      putBlob: vi.fn(),
      getBlob: vi.fn(),
      deleteBlob: vi.fn(),
      putThumbnail: vi.fn().mockResolvedValue(undefined),
      getThumbnail: vi.fn(),
    } satisfies ProjectRepository;
    const thumbnail = new Blob(['thumb'], { type: 'image/jpeg' });
    const projectId = newProjectId();

    useProjectStore
      .getState()
      .replaceProject(createEmptyProject('Auto', { id: projectId, now: new Date().toISOString() }));

    const stop = startAutosave({
      repo,
      intervalMs: 50,
      captureThumbnail: vi.fn().mockResolvedValue(thumbnail),
    });

    useProjectStore.getState().patchProject((d) => {
      d.name = 'with-thumb';
    });

    await vi.advanceTimersByTimeAsync(80);

    expect(repo.saveProject).toHaveBeenCalledTimes(1);
    expect(repo.putThumbnail).toHaveBeenCalledTimes(1);
    expect(repo.putThumbnail).toHaveBeenCalledWith(projectId, thumbnail);

    stop();
    vi.useRealTimers();
  });
});
