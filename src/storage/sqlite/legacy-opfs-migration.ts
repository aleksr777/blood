import type { Database, Sqlite3Static } from '@sqlite.org/sqlite-wasm';

const LEGACY_DATABASE_FILE = '/blood.sqlite3';

type LegacyDepartment = {
  name: string;
};

const hasDepartmentsTable = (db: Database) => {
  const rows = db.exec({
    sql: "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'departments' LIMIT 1",
    returnValue: 'resultRows',
  }) as unknown[];

  return rows.length > 0;
};

const readDepartments = (db: Database) =>
  db.exec({
    sql: 'SELECT name FROM departments ORDER BY updated_at DESC, id DESC',
    rowMode: 'object',
    returnValue: 'resultRows',
  }) as LegacyDepartment[];

const insertDepartment = (db: Database, name: string) => {
  const value = name.trim().replace(/\s+/g, ' ');
  if (!value) return;

  const now = Date.now();
  db.exec({
    sql: `
      INSERT INTO departments (name, normalized_name, created_at, updated_at)
      VALUES ($name, $normalizedName, $now, $now)
      ON CONFLICT(normalized_name) DO NOTHING
    `,
    bind: {
      $name: value,
      $normalizedName: value.toLocaleLowerCase('ru-RU'),
      $now: now,
    },
  });
};

export const migrateLegacyOpfsDepartments = async (
  sqlite3: Sqlite3Static,
  target: Database,
) => {
  if (!globalThis.crossOriginIsolated) return;

  let legacy: Database | null = null;

  try {
    legacy = new sqlite3.oo1.OpfsDb(LEGACY_DATABASE_FILE);
    if (!hasDepartmentsTable(legacy)) return;

    readDepartments(legacy).forEach(({ name }) => insertDepartment(target, name));
  } catch {
    // The previous OPFS VFS may not exist in this browser. Nothing to migrate.
  } finally {
    legacy?.close();
  }
};
