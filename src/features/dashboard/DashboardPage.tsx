import { useEffect, useMemo, useState } from 'react';
import { useDashboard } from './useDashboard';
import { downloadProjectJson, parseProjectFromJson } from '@/storage';
import type { ProjectSummary } from '@/storage';
import { ThemeToggle } from '@/components';

const useThumbnailUrl = (blob: Blob | undefined): string | null => {
  const url = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob]);
  useEffect(() => {
    if (!url) return;
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [url]);
  return url;
};

const ProjectThumbnail = ({ project }: { project: ProjectSummary }) => {
  const url = useThumbnailUrl(project.thumbnailBlob);
  return (
    <div
      style={{
        width: '100%',
        aspectRatio: '4 / 3',
        background: 'var(--mlp-thumb-bg)',
        borderRadius: 6,
        marginBottom: 10,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--mlp-thumb-fg)',
        fontSize: 12,
      }}
    >
      {url ? (
        <img
          src={url}
          alt={`Thumbnail of ${project.name}`}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <span>No preview yet</span>
      )}
    </div>
  );
};

export type DashboardPageProps = {
  onOpenProject: (id: string) => void;
};

export const DashboardPage = ({ onOpenProject }: DashboardPageProps) => {
  const { projects, loading, error, createProject, renameProject, duplicateProject, deleteProject, repo, refresh } = useDashboard();
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
    <div style={{ padding: 24, maxWidth: 960, margin: '0 auto', fontFamily: 'system-ui, sans-serif', color: 'var(--mlp-text)' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>2D Material Layout Planner</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New project name"
            style={{ padding: '4px 8px', minWidth: 200 }}
          />
          <button
            type="button"
            onClick={async () => {
              const p = await createProject(newName);
              setNewName('');
              onOpenProject(p.id);
            }}
          >
            New project
          </button>
          <label style={{ background: 'var(--mlp-surface-2)', color: 'var(--mlp-text)', padding: '4px 10px', borderRadius: 4, cursor: 'pointer' }}>
            Import JSON
            <input
              type="file"
              accept="application/json"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onImport(file);
              }}
            />
          </label>
          <ThemeToggle />
        </div>
      </header>
      {error ? <p style={{ color: 'var(--mlp-danger)' }}>Error: {error}</p> : null}
      {importErr ? <p style={{ color: 'var(--mlp-danger)' }}>Import error: {importErr}</p> : null}
      {loading ? <p>Loading...</p> : null}
      {!loading && projects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--mlp-muted)' }}>
          <p>No projects yet. Create your first project to get started.</p>
        </div>
      ) : null}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {projects.map((p) => (
          <article
            key={p.id}
            style={{ border: '1px solid var(--mlp-border)', borderRadius: 8, padding: 14, background: 'var(--mlp-card)', color: 'var(--mlp-text)' }}
          >
            <ProjectThumbnail project={p} />
            <h3 style={{ margin: '0 0 8px 0', fontSize: 16 }}>{p.name}</h3>
            <p style={{ margin: 0, color: 'var(--mlp-muted)', fontSize: 12 }}>
              Updated {new Date(p.updatedAt).toLocaleString()}
            </p>
            <p style={{ margin: '4px 0 12px 0', color: 'var(--mlp-muted)', fontSize: 12 }}>
              {p.surfaceCount} surfaces \u00B7 {p.materialCount} materials
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <button type="button" onClick={() => onOpenProject(p.id)}>Open</button>
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
              <button type="button" onClick={() => void onExport(p.id)}>Export JSON</button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Delete project "${p.name}"?`)) {
                    void deleteProject(p.id);
                  }
                }}
                style={{ color: 'var(--mlp-danger)' }}
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
