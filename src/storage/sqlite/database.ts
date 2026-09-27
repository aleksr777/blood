import sqlite3InitModule from '@sqlite.org/sqlite-wasm';

const DATABASE_FILE = '/blood.sqlite3';

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

export type SqliteDatabase = Awaited<ReturnType<typeof openDatabase>>;

let databasePromise: ReturnType<typeof openDatabase> | null = null;

export const getDatabase = () => {
  databasePromise ??= openDatabase();
  return databasePromise;
};
