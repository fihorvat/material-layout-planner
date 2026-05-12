import { type Project } from '@/types';
import { migrateProject } from './migrations';

const slugify = (name: string): string =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'project';

export class ProjectImportError extends Error {
  readonly cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'ProjectImportError';
    this.cause = cause;
  }
}

export const exportProjectToJson = (project: Project): Blob => {
  const text = JSON.stringify(project, null, 2);
  return new Blob([text], { type: 'application/json' });
};

export const projectJsonFileName = (project: Project): string => {
  const slug = slugify(project.name);
  const suffix = project.id.slice(-6);
  return `${slug}-${suffix}.mlp.json`;
};

export const downloadProjectJson = (project: Project): void => {
  const blob = exportProjectToJson(project);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = projectJsonFileName(project);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 0);
};

export const parseProjectFromJson = (text: string): Project => {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (err) {
    throw new ProjectImportError('Project file is not valid JSON', err);
  }
  try {
    return migrateProject(raw);
  } catch (err) {
    throw new ProjectImportError(
      err instanceof Error ? err.message : 'Project file failed validation',
      err,
    );
  }
};

export const pickAndImportProjectJson = (): Promise<Project | null> => {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      try {
        const text = await file.text();
        resolve(parseProjectFromJson(text));
      } catch (err) {
        reject(err);
      }
    };
    input.click();
  });
};
