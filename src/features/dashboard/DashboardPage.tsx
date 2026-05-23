import { useEffect, useState } from 'react';
import { useDashboard } from './useDashboard';
import { downloadProjectJson, parseProjectFromJson } from '@/storage';
import type { ProjectSummary } from '@/storage';
import { ThemeToggle } from '@/components';
import styles from './dashboard.module.css';

const useThumbnailUrl = (blob: Blob | undefined): string | null => {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!blob) {
      setUrl(null);
      return;
    }
    const nextUrl = URL.createObjectURL(blob);
    setUrl(nextUrl);
    return () => {
      URL.revokeObjectURL(nextUrl);
    };
  }, [blob]);
  return url;
};

const ProjectThumbnail = ({ project }: { project: ProjectSummary }) => {
  const url = useThumbnailUrl(project.thumbnailBlob);
  return (
    <div className={styles.thumb}>
      {url ? <img src={url} alt={`Thumbnail of ${project.name}`} /> : <span>No preview yet</span>}
    </div>
  );
};

type DashboardPageProps = {
  onOpenProject: (id: string) => void;
};

export const DashboardPage = ({ onOpenProject }: DashboardPageProps) => {
  const {
    projects,
    loading,
    error,
    createProject,
    renameProject,
    duplicateProject,
    deleteProject,
    repo,
    refresh,
  } = useDashboard();
  const [newName, setNewName] = useState('');
  const [importErr, setImportErr] = useState<string | null>(null);

  const onImport = async (file: File) => {
    setImportErr(null);
    try {
      const text = await file.text();
      const project = parseProjectFromJson(text);
      await repo.saveProject(project);
      await refresh();
      onOpenProject(project.id);
    } catch (e) {
      setImportErr(e instanceof Error ? e.message : 'Invalid JSON');
    }
  };

  const onExport = async (id: string) => {
    const project = await repo.getProject(id);
    if (project) downloadProjectJson(project);
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>2D Material Layout Planner</h1>
          <div className={styles.headerActions}>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New project name"
              className={styles.newProjectInput}
            />
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={async () => {
                const p = await createProject(newName);
                setNewName('');
                onOpenProject(p.id);
              }}
            >
              New project
            </button>
            <label className={`${styles.secondaryBtn} ${styles.importLabel}`}>
              Import JSON
              <input
                type="file"
                accept="application/json"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void onImport(file);
                }}
              />
            </label>
            <ThemeToggle />
          </div>
        </header>
        {error ? <p className={styles.alert}>Error: {error}</p> : null}
        {importErr ? <p className={styles.alert}>Import error: {importErr}</p> : null}
        {loading ? <p className={styles.loading}>{'Loading\u2026'}</p> : null}
        {!loading && projects.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>No projects yet</p>
            <p className={styles.emptySubtitle}>Create your first project to get started.</p>
          </div>
        ) : null}
        <div className={styles.grid}>
          {projects.map((p) => (
            <article key={p.id} className={styles.card}>
              <ProjectThumbnail project={p} />
              <h3 className={styles.cardTitle}>{p.name}</h3>
              <p className={styles.cardMeta}>Updated {new Date(p.updatedAt).toLocaleString()}</p>
              <p className={styles.cardMetaMuted}>
                {p.surfaceCount} surfaces {'\u00B7'} {p.materialCount} materials
              </p>
              <div className={styles.cardActions}>
                <button
                  type="button"
                  className={styles.openBtn}
                  onClick={() => onOpenProject(p.id)}
                >
                  Open
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = window.prompt('Rename to', p.name);
                    if (next) void renameProject(p.id, next.trim());
                  }}
                >
                  Rename
                </button>
                <button
                  type="button"
                  onClick={() => void duplicateProject(p.id, `${p.name} (copy)`)}
                >
                  Duplicate
                </button>
                <button type="button" onClick={() => void onExport(p.id)}>
                  Export JSON
                </button>
                <button
                  type="button"
                  className={styles.deleteBtn}
                  onClick={() => {
                    if (window.confirm(`Delete project "${p.name}"?`)) {
                      void deleteProject(p.id);
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};
