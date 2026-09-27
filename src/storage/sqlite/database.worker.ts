import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import type { DatabaseRequest, DatabaseResponse, DepartmentRecord } from './database-types';

const DATABASE_FILE = '/blood.sqlite3';

const normalizeName = (value: string) => value.trim().replace(/\s+/g, ' ');
const normalizeKey = (value: string) => normalizeName(value).toLocaleLowerCase('ru-RU');

const getRows = (db: Awaited<ReturnType<typeof openDatabase>>) =>
  db.exec({
    sql: 'SELECT id, name FROM departments ORDER BY updated_at DESC, id DESC',
    rowMode: 'object',
    returnValue: 'resultRows',
  }) as DepartmentRecord[];

const openDatabase = async () => {
  const sqlite3 = await sqlite3InitModule();

  if (!('opfs' in sqlite3) || !sqlite3.oo1.OpfsDb) {
    throw new Error('OPFS недоступен в этом браузере или контексте.');
  }

  const db = new sqlite3.oo1.OpfsDb(DATABASE_FILE);
  db.exec(`
    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      normalized_name TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  return db;
};

let databasePromise: ReturnType<typeof openDatabase> | null = null;

const getDatabase = () => {
  databasePromise ??= openDatabase();
  return databasePromise;
};

const rememberDepartment = async (name: string) => {
  const value = normalizeName(name);
  if (!value) return getRows(await getDatabase());

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

const renameDepartment = async (id: number, name: string) => {
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

const removeDepartment = async (id: number) => {
  const db = await getDatabase();
  db.exec({ sql: 'DELETE FROM departments WHERE id = $id', bind: { $id: id } });
  return getRows(db);
};

const importDepartments = async (names: string[]) => {
  for (const name of names) await rememberDepartment(name);
  return getRows(await getDatabase());
};

const handleRequest = async (request: DatabaseRequest) => {
  switch (request.action) {
    case 'init':
      await getDatabase();
      return true;
    case 'departments:list':
      return getRows(await getDatabase());
    case 'departments:remember':
      return rememberDepartment((request.payload as { name: string }).name);
    case 'departments:rename': {
      const payload = request.payload as { id: number; name: string };
      return renameDepartment(payload.id, payload.name);
    }
    case 'departments:remove':
      return removeDepartment((request.payload as { id: number }).id);
    case 'departments:import':
      return importDepartments((request.payload as { names: string[] }).names);
  }
};

const send = (response: DatabaseResponse) => {
  const scope = globalThis as unknown as { postMessage: (message: DatabaseResponse) => void };
  scope.postMessage(response);
};

globalThis.addEventListener('message', (event: MessageEvent<DatabaseRequest>) => {
  void handleRequest(event.data)
    .then((result) => send({ id: event.data.id, ok: true, result }))
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      send({ id: event.data.id, ok: false, error: message });
    });
});
