import { describe, it, expect, beforeEach } from 'vitest';
import { useProjectStore } from '../projectStore';
import { createEmptyProject } from '@/types';
import { newProjectId } from '@/domain/ids';

describe('projectStore', () => {
  beforeEach(() => {
    useProjectStore.getState().resetForTests();
  });

  it('starts with a non-dirty project', () => {
    const { project, isDirty } = useProjectStore.getState();
    expect(project.name).toBe('Untitled');
    expect(isDirty).toBe(false);
  });

  it('patchProject flips isDirty and bumps updatedAt', async () => {
    const before = useProjectStore.getState().project.updatedAt;
    await new Promise((r) => setTimeout(r, 5));
    useProjectStore.getState().patchProject((d) => {
      d.name = 'Renamed';
    });
    const after = useProjectStore.getState();
    expect(after.project.name).toBe('Renamed');
    expect(after.isDirty).toBe(true);
    expect(after.project.updatedAt > before).toBe(true);
  });

  it('replaceProject resets isDirty', () => {
    useProjectStore.getState().patchProject((d) => {
      d.name = 'Dirty';
    });
    expect(useProjectStore.getState().isDirty).toBe(true);

    const next = createEmptyProject('Loaded', {
      id: newProjectId(),
      now: new Date().toISOString(),
    });
    useProjectStore.getState().replaceProject(next);
    expect(useProjectStore.getState().isDirty).toBe(false);
    expect(useProjectStore.getState().project.name).toBe('Loaded');
  });

  it('markSaved updates lastSavedAt and clears dirty', () => {
    useProjectStore.getState().patchProject((d) => {
      d.name = 'X';
    });
    const ts = new Date().toISOString();
    useProjectStore.getState().markSaved(ts);
    expect(useProjectStore.getState().lastSavedAt).toBe(ts);
    expect(useProjectStore.getState().isDirty).toBe(false);
  });
});
