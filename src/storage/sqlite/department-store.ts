import { getDatabase, type SqliteDatabase } from './database';
import type { DepartmentRecord } from './database-types';

const normalizeName = (value: string) => value.trim().replace(/\s+/g, ' ');
const normalizeKey = (value: string) => normalizeName(value).toLocaleLowerCase('ru-RU');

const getRows = (db: SqliteDatabase) =>
  db.exec({
    sql: 'SELECT id, name FROM departments ORDER BY updated_at DESC, id DESC',
    rowMode: 'object',
    returnValue: 'resultRows',
  }) as DepartmentRecord[];

export const listDepartments = async () => getRows(await getDatabase());

export const rememberDepartment = async (name: string) => {
  const value = normalizeName(name);
  if (!value) return listDepartments();

  const db = await getDatabase();
  const now = Date.now();
  db.exec({
    sql: `
      INSERT INTO departments (name, normalized_name, created_at, updated_at)
      VALUES ($name, $normalizedName, $now, $now)
      ON CONFLICT(normalized_name) DO UPDATE SET
        name = excluded.name,
        updated_at = excluded.updated_at
    `,
    bind: {
      $name: value,
      $normalizedName: normalizeKey(value),
      $now: now,
    },
  });

  return getRows(db);
};

export const renameDepartment = async (id: number, name: string) => {
  const value = normalizeName(name);
  const db = await getDatabase();

  if (!value) {
    db.exec({ sql: 'DELETE FROM departments WHERE id = $id', bind: { $id: id } });
    return getRows(db);
  }

  const normalizedName = normalizeKey(value);
  const duplicate = db.exec({
    sql: 'SELECT id FROM departments WHERE normalized_name = $normalizedName',
    bind: { $normalizedName: normalizedName },
    rowMode: 'object',
    returnValue: 'resultRows',
  }) as Array<{ id: number }>;

  const duplicateId = duplicate[0]?.id;
  if (duplicateId && duplicateId !== id) {
    db.exec({
      sql: 'UPDATE departments SET name = $name, updated_at = $now WHERE id = $duplicateId',
      bind: { $name: value, $now: Date.now(), $duplicateId: duplicateId },
    });
    db.exec({ sql: 'DELETE FROM departments WHERE id = $id', bind: { $id: id } });
  } else {
    db.exec({
      sql: `
        UPDATE departments
        SET name = $name, normalized_name = $normalizedName, updated_at = $now
        WHERE id = $id
      `,
      bind: { $name: value, $normalizedName: normalizedName, $now: Date.now(), $id: id },
    });
  }

  return getRows(db);
};

export const removeDepartment = async (id: number) => {
  const db = await getDatabase();
  db.exec({ sql: 'DELETE FROM departments WHERE id = $id', bind: { $id: id } });
  return getRows(db);
};

export const importDepartments = async (names: string[]) => {
  for (const name of names) await rememberDepartment(name);
  return listDepartments();
};
