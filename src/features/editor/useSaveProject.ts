import { useCallback, useState } from 'react';
import { useProjectStore } from '@/state';
import { useToastStore } from '@/state/toastStore';
import { createProjectRepository } from '@/storage';
import { captureStageThumbnail } from './canvas/activeStage';

const repo = createProjectRepository();

export type UseSaveProjectResult = {
  saveProject: () => Promise<void>;
  saving: boolean;
};

export const useSaveProject = (): UseSaveProjectResult => {
  const [saving, setSaving] = useState(false);

  const saveProject = useCallback(async () => {
    const pushToast = useToastStore.getState().pushToast;
    setSaving(true);
    try {
      const project = useProjectStore.getState().project;
      await repo.saveProject(project);
      const thumb = await captureStageThumbnail({
        targetWidth: 480,
        mimeType: 'image/jpeg',
        quality: 0.75,
      });
      if (thumb) {
        await repo.putThumbnail(project.id, thumb);
      }
      useProjectStore.getState().markSaved(new Date().toISOString());
      pushToast('Project saved.', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      useToastStore.getState().pushToast(`Save failed: ${message}`, 'error');
    } finally {
      setSaving(false);
    }
  }, []);

  return { saveProject, saving };
};
