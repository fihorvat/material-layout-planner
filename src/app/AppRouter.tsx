import { useEffect, useState } from 'react';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { EditorPage } from '@/features/editor/EditorPage';
import { useEditorStore, useProjectStore } from '@/state';
import { createProjectRepository, startAutosave } from '@/storage';
import { getActiveStage } from '@/features/editor/canvas/activeStage';
import {
  computeFitViewport,
  computeProjectContentBounds,
} from '@/features/editor/canvas/fitToContent';

const repo = createProjectRepository();
const AUTOSAVE_INTERVAL_MS = 1000;

type Route =
  | { kind: 'dashboard' }
  | { kind: 'project'; id: string };

const parseHash = (): Route => {
  const hash = window.location.hash;
  const match = hash.match(/^#\/project\/([^/]+)/);
  if (match) return { kind: 'project', id: match[1]! };
  return { kind: 'dashboard' };
};

const useHashRoute = (): Route => {
  const [route, setRoute] = useState<Route>(() => parseHash());
  useEffect(() => {
    const handler = () => setRoute(parseHash());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);
  return route;
};

const navigateTo = (route: Route) => {
  if (route.kind === 'dashboard') {
    window.location.hash = '#/';
  } else {
    window.location.hash = `#/project/${route.id}`;
  }
};

export const AppRouter = () => {
  const route = useHashRoute();
  const replaceProject = useProjectStore((s) => s.replaceProject);
  const [loaded, setLoaded] = useState<string | null>(null);

  useEffect(() => {
    if (route.kind !== 'project') {
      setLoaded(null);
      return;
    }
    if (loaded === route.id) return;
    void repo.getProject(route.id).then((project) => {
      if (project) {
        replaceProject(project);
        setLoaded(project.id);
      }
    });
  }, [route, replaceProject, loaded]);

  // Run a real autosave loop while a project is open. Without this, the
  // ErrorBoundary's reassurance about an "autosave intact in IndexedDB"
  // would be misleading: the latest in-memory edits would only land on
  // disk on manual Ctrl+S. Tearing down on route change ensures we do
  // not keep a stale subscription writing after the user leaves.
  useEffect(() => {
    if (route.kind !== 'project') return;
    if (loaded !== route.id) return;
    const stop = startAutosave({ repo, intervalMs: AUTOSAVE_INTERVAL_MS });
    return stop;
  }, [route, loaded]);

  // Invoke the existing "Fit to content" command once after the project
  // is loaded. The stage is mounted by CanvasStage on the next frames, so
  // we poll via requestAnimationFrame until it has a non-zero size, then
  // run the same logic the toolbar's Fit to content button uses.
  useEffect(() => {
    if (route.kind !== 'project' || loaded !== route.id) return;
    let cancelled = false;
    let frame = 0;
    const attempt = () => {
      if (cancelled) return;
      const stage = getActiveStage();
      if (!stage || stage.width() <= 0 || stage.height() <= 0) {
        frame = requestAnimationFrame(attempt);
        return;
      }
      const project = useProjectStore.getState().project;
      const editor = useEditorStore.getState();
      const bounds = computeProjectContentBounds(project);
      if (!bounds) {
        editor.resetViewport();
        return;
      }
      editor.setViewport(
        computeFitViewport(bounds, {
          width: stage.width(),
          height: stage.height(),
        }),
      );
    };
    frame = requestAnimationFrame(attempt);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [route, loaded]);

  if (route.kind === 'project') {
    return <EditorPage />;
  }
  return <DashboardPage onOpenProject={(id) => navigateTo({ kind: 'project', id })} />;
};
