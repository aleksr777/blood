import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import { migrateLegacyOpfsDepartments } from './legacy-opfs-migration';
import { migrateRecipientNameConstraint } from './recipient-name-migration';

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

    CREATE TABLE IF NOT EXISTS saved_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      value TEXT NOT NULL,
      normalized_value TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      UNIQUE(category, normalized_value)
    );

    CREATE TABLE IF NOT EXISTS protocol_draft (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      values_json TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS recipients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      normalized_name TEXT NOT NULL,
      birth_date TEXT NOT NULL DEFAULT '',
      profile_json TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS protocol_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipient_id INTEGER NOT NULL,
      values_json TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY(recipient_id) REFERENCES recipients(id)
    );

    CREATE INDEX IF NOT EXISTS idx_recipients_name
      ON recipients(normalized_name);
    CREATE INDEX IF NOT EXISTS idx_protocol_records_recipient
      ON protocol_records(recipient_id, updated_at DESC);
  `);

  migrateRecipientNameConstraint(db);

  await migrateLegacyOpfsDepartments(sqlite3, db);
  return db;
};

export type SqliteDatabase = Awaited<ReturnType<typeof openDatabase>>;

let databasePromise: ReturnType<typeof openDatabase> | null = null;

export const getDatabase = () => {
  databasePromise ??= openDatabase();
  return databasePromise;
};
