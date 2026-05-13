import { create } from 'zustand';
import { useProjectStore } from '@/state';
import { useToastStore } from '@/state/toastStore';
import { createProjectRepository } from '@/storage';
import { captureStageThumbnail } from './canvas/activeStage';

const repo = createProjectRepository();

type SavingStore = { saving: boolean; setSaving: (v: boolean) => void };

// Module-level store backs the saving indicator. Keeping the state outside
// of any component fiber prevents async setState-after-unmount races that
// can surface as "Should have a queue. This is likely a bug in React."
// when Save is triggered from a portal/menu that closes before the
// save promise resolves.
const useSavingStore = create<SavingStore>((set) => ({
  saving: false,
  setSaving: (v) => set({ saving: v }),
}));

let inFlight: Promise<void> | null = null;

// Stable, module-level save action. Coalesces concurrent calls so that
// pressing Ctrl+S repeatedly (or via toolbar/menu/shortcut at once) does
// not stack overlapping IDB writes.
const saveProjectNow = async (): Promise<void> => {
  if (inFlight) return inFlight;
  const setSaving = useSavingStore.getState().setSaving;
  const pushToast = useToastStore.getState().pushToast;
  setSaving(true);
  const run = (async () => {
    try {
      const project = useProjectStore.getState().project;
      await repo.saveProject(project);
      let thumb: Blob | null = null;
      try {
        thumb = await captureStageThumbnail({
          targetWidth: 480,
          mimeType: 'image/jpeg',
          quality: 0.75,
        });
      } catch {
        // Thumbnail is best-effort; never let it abort the save.
        thumb = null;
      }
      if (thumb) {
        try {
          await repo.putThumbnail(project.id, thumb);
        } catch {
          // Thumbnail persistence is best-effort.
        }
      }
      useProjectStore.getState().markSaved(new Date().toISOString());
      pushToast('Project saved.', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      pushToast(`Save failed: ${message}`, 'error');
    } finally {
      setSaving(false);
      inFlight = null;
    }
  })();
  inFlight = run;
  return run;
};

type UseSaveProjectResult = {
  saveProject: () => Promise<void>;
  saving: boolean;
};

export const useSaveProject = (): UseSaveProjectResult => {
  const saving = useSavingStore((s) => s.saving);
  return { saveProject: saveProjectNow, saving };
};
