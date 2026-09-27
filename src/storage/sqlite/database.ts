import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import { migrateLegacyOpfsDepartments } from './legacy-opfs-migration';

const DATABASE_FILE = '/blood.sqlite3';

const openDatabase = async () => {
  const sqlite3 = await sqlite3InitModule();
  const pool = await sqlite3.installOpfsSAHPoolVfs({
    initialCapacity: 6,
    name: 'blood-opfs-sahpool',
    directory: '/blood-opfs-sahpool',
  });
  const db = new pool.OpfsSAHPoolDb(DATABASE_FILE);

  db.exec(`
    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      normalized_name TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  await migrateLegacyOpfsDepartments(sqlite3, db);
  return db;
};

export type SqliteDatabase = Awaited<ReturnType<typeof openDatabase>>;

let databasePromise: ReturnType<typeof openDatabase> | null = null;

export const getDatabase = () => {
  databasePromise ??= openDatabase();
  return databasePromise;
};
