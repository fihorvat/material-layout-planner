import { useProjectStore } from '@/state';
import { useToastStore } from '@/state/toastStore';
import type { ProjectRepository } from './projectRepository';
import type { Project } from '@/types';

export type AutosaveOptions = {
  repo: ProjectRepository;
  intervalMs?: number;
  enabled?: () => boolean;
  captureThumbnail?: () => Promise<Blob | null>;
};

export const startAutosave = (opts: AutosaveOptions): (() => void) => {
  const intervalMs = opts.intervalMs ?? 500;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: Project | null = null;
  let lastSavedKey: string | null = null;

  const flush = async () => {
    if (!pending) return;
    if (opts.enabled && !opts.enabled()) {
      return;
    }
    const toSave = pending;
    pending = null;
    const key = `${toSave.id}:${toSave.updatedAt}`;
    if (key === lastSavedKey) return;
    try {
      await opts.repo.saveProject(toSave);
      if (opts.captureThumbnail) {
        try {
          const thumbnail = await opts.captureThumbnail();
          if (thumbnail) {
            await opts.repo.putThumbnail(toSave.id, thumbnail);
          }
        } catch {
          // Thumbnail capture is best-effort; autosave must still persist project data.
        }
      }
      lastSavedKey = key;
      useProjectStore.getState().markSaved(new Date().toISOString());
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      useToastStore.getState().pushToast(`Autosave failed: ${message}`, 'warning');
    }
  };

  const unsubscribe = useProjectStore.subscribe(
    (state) => state.project,
    (project) => {
      pending = project;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        void flush();
      }, intervalMs);
    },
  );

  return () => {
    if (timer) clearTimeout(timer);
    timer = null;
    unsubscribe();
  };
};
