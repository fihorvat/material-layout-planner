import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Project } from '@/types';

export const DB_NAME = 'material-layout-planner';
export const DB_VERSION = 1;

export type ProjectRecord = {
  id: string;
  name: string;
  schemaVersion: number;
  updatedAt: string;
  createdAt: string;
  project: Project;
};

export interface MlpDb extends DBSchema {
  projects: {
    key: string;
    value: ProjectRecord;
    indexes: { 'by-updatedAt': string; 'by-name': string };
  };
  blobs: {
    key: string;
    value: Blob;
  };
  thumbnails: {
    key: string;
    value: Blob;
  };
}

let dbPromise: Promise<IDBPDatabase<MlpDb>> | null = null;

export const openMlpDb = (): Promise<IDBPDatabase<MlpDb>> => {
  if (!dbPromise) {
    dbPromise = openDB<MlpDb>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const projects = db.createObjectStore('projects', { keyPath: 'id' });
          projects.createIndex('by-updatedAt', 'updatedAt');
          projects.createIndex('by-name', 'name');
          db.createObjectStore('blobs');
          db.createObjectStore('thumbnails');
        }
      },
    });
  }
  return dbPromise;
};

export const resetDbConnectionForTests = (): void => {
  dbPromise = null;
};
