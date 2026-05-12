import { ProjectSchema, type Project } from '@/types';
import { openMlpDb, type ProjectRecord } from './indexedDb';
import { migrateProject } from './migrations';
import { newProjectId } from '@/domain/ids';

export type ProjectSummary = {
  id: string;
  name: string;
  updatedAt: string;
  createdAt: string;
  surfaceCount: number;
  materialCount: number;
  thumbnailBlob?: Blob;
};

export interface ProjectRepository {
  listProjects(): Promise<ProjectSummary[]>;
  getProject(id: string): Promise<Project | null>;
  saveProject(project: Project): Promise<void>;
  deleteProject(id: string): Promise<void>;
  duplicateProject(id: string, newName: string): Promise<Project>;
  putBlob(key: string, blob: Blob): Promise<void>;
  getBlob(key: string): Promise<Blob | null>;
  deleteBlob(key: string): Promise<void>;
  putThumbnail(projectId: string, blob: Blob): Promise<void>;
  getThumbnail(projectId: string): Promise<Blob | null>;
}

const toRecord = (project: Project): ProjectRecord => ({
  id: project.id,
  name: project.name,
  schemaVersion: project.schemaVersion,
  updatedAt: project.updatedAt,
  createdAt: project.createdAt,
  project,
});

const summarize = (record: ProjectRecord, thumbnailBlob?: Blob): ProjectSummary => ({
  id: record.id,
  name: record.name,
  updatedAt: record.updatedAt,
  createdAt: record.createdAt,
  surfaceCount: record.project.surfaces.length,
  materialCount: record.project.materials.length,
  thumbnailBlob,
});

export const createProjectRepository = (): ProjectRepository => {
  return {
    async listProjects() {
      const db = await openMlpDb();
      const records = await db.getAll('projects');
      const out: ProjectSummary[] = [];
      for (const rec of records) {
        const thumb = (await db.get('thumbnails', rec.id)) ?? undefined;
        out.push(summarize(rec, thumb));
      }
      out.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
      return out;
    },

    async getProject(id) {
      const db = await openMlpDb();
      const rec = await db.get('projects', id);
      if (!rec) return null;
      return migrateProject(rec.project);
    },

    async saveProject(project) {
      const validated = ProjectSchema.parse(project);
      const db = await openMlpDb();
      await db.put('projects', toRecord(validated));
    },

    async deleteProject(id) {
      const db = await openMlpDb();
      const tx = db.transaction(['projects', 'thumbnails', 'blobs'], 'readwrite');
      await tx.objectStore('projects').delete(id);
      await tx.objectStore('thumbnails').delete(id);
      const blobsStore = tx.objectStore('blobs');
      let cursor = await blobsStore.openCursor();
      const prefix = `bg:${id}:`;
      while (cursor) {
        if (typeof cursor.key === 'string' && cursor.key.startsWith(prefix)) {
          await cursor.delete();
        }
        cursor = await cursor.continue();
      }
      await tx.done;
    },

    async duplicateProject(id, newName) {
      const db = await openMlpDb();
      const rec = await db.get('projects', id);
      if (!rec) {
        throw new Error(`Project ${id} not found`);
      }
      const now = new Date().toISOString();
      const duplicated: Project = {
        ...rec.project,
        id: newProjectId(),
        name: newName,
        createdAt: now,
        updatedAt: now,
      };
      const validated = ProjectSchema.parse(duplicated);
      await db.put('projects', toRecord(validated));
      return validated;
    },

    async putBlob(key, blob) {
      const db = await openMlpDb();
      await db.put('blobs', blob, key);
    },

    async getBlob(key) {
      const db = await openMlpDb();
      return (await db.get('blobs', key)) ?? null;
    },

    async deleteBlob(key) {
      const db = await openMlpDb();
      await db.delete('blobs', key);
    },

    async putThumbnail(projectId, blob) {
      const db = await openMlpDb();
      await db.put('thumbnails', blob, projectId);
    },

    async getThumbnail(projectId) {
      const db = await openMlpDb();
      return (await db.get('thumbnails', projectId)) ?? null;
    },
  };
};
