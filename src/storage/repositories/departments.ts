import { database } from '../sqlite/database-client';
import type { DepartmentRecord } from '../sqlite/database-types';

const LEGACY_STORAGE_KEY = 'blood.protocol.departments';

let migration: Promise<void> | null = null;

const readLegacyDepartments = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY) ?? '[]');
    if (!Array.isArray(stored)) return [];

    return stored.filter((value): value is string => typeof value === 'string');
  } catch {
    return [];
  }
};

const ensureMigrated = () => {
  migration ??= (async () => {
    const legacy = readLegacyDepartments();
    if (legacy.length === 0) return;

    await database.importDepartments(legacy);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  })();

  return migration;
};

export const loadDepartments = async (): Promise<DepartmentRecord[]> => {
  await ensureMigrated();
  return database.listDepartments();
};

export const rememberDepartment = async (name: string) => {
  await ensureMigrated();
  return database.rememberDepartment(name);
};

export const renameDepartment = async (id: number, name: string) => {
  await ensureMigrated();
  return database.renameDepartment(id, name);
};

export const removeDepartment = async (id: number) => {
  await ensureMigrated();
  return database.removeDepartment(id);
};

export type { DepartmentRecord };
