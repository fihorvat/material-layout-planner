import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Project } from '@/types';
import { createEmptyProject } from '@/types';
import { newProjectId } from '@/domain/ids';

export type ProjectState = {
  project: Project;
  isDirty: boolean;
  lastSavedAt: string | null;

  replaceProject: (next: Project) => void;
  patchProject: (producer: (draft: Project) => void) => void;
  markSaved: (savedAt: string) => void;
  resetForTests: () => void;
};

const initialProject = (): Project =>
  createEmptyProject('Untitled', { id: newProjectId(), now: new Date().toISOString() });

const buildInitialState = () => ({
  project: initialProject(),
  isDirty: false,
  lastSavedAt: null as string | null,
});

export const useProjectStore = create<ProjectState>()(
  subscribeWithSelector(
    immer((set) => ({
      ...buildInitialState(),

      replaceProject: (next) =>
        set((s) => {
          s.project = next;
          s.isDirty = false;
        }),

      patchProject: (producer) =>
        set((s) => {
          producer(s.project);
          s.project.updatedAt = new Date().toISOString();
          s.isDirty = true;
        }),

      markSaved: (savedAt) =>
        set((s) => {
          s.lastSavedAt = savedAt;
          s.isDirty = false;
        }),

      resetForTests: () =>
        set((s) => {
          const fresh = buildInitialState();
          s.project = fresh.project;
          s.isDirty = fresh.isDirty;
          s.lastSavedAt = fresh.lastSavedAt;
        }),
    })),
  ),
);

export const getProject = (): Project => useProjectStore.getState().project;
