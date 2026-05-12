import { useCallback, useEffect, useState } from 'react';
import { createProjectRepository, type ProjectSummary } from '@/storage';
import { createEmptyProject } from '@/types';
import { newProjectId } from '@/domain/ids';

const repo = createProjectRepository();

export const useDashboard = () => {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await repo.listProjects();
      setProjects(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createProject = useCallback(async (name: string) => {
    const trimmed = name.trim() || 'Untitled';
    const project = createEmptyProject(trimmed, { id: newProjectId(), now: new Date().toISOString() });
    await repo.saveProject(project);
    await refresh();
    return project;
  }, [refresh]);

  const renameProject = useCallback(async (id: string, name: string) => {
    const project = await repo.getProject(id);
    if (!project) return;
    const next = { ...project, name, updatedAt: new Date().toISOString() };
    await repo.saveProject(next);
    await refresh();
  }, [refresh]);

  const duplicateProject = useCallback(async (id: string, name: string) => {
    await repo.duplicateProject(id, name);
    await refresh();
  }, [refresh]);

  const deleteProject = useCallback(async (id: string) => {
    await repo.deleteProject(id);
    await refresh();
  }, [refresh]);

  return {
    projects,
    loading,
    error,
    refresh,
    createProject,
    renameProject,
    duplicateProject,
    deleteProject,
    repo,
  };
};
