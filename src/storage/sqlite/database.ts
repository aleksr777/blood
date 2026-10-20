import sqlite3InitModule, { type Database } from '@sqlite.org/sqlite-wasm';
import { migrateLegacyOpfsDepartments } from './legacy-opfs-migration';
import { migrateRecipientNameConstraint } from './recipient-name-migration';

const DATABASE_FILE = '/blood.sqlite3';
const DATABASE_LOCK_NAME = 'blood-opfs-sahpool-access';

const getSqlite3 = (() => {
  let promise: ReturnType<typeof sqlite3InitModule> | null = null;

  return () => {
    promise ??= sqlite3InitModule();
    return promise;
  };
})();

const installPool = async () => {
  const sqlite3 = await getSqlite3();
  return sqlite3.installOpfsSAHPoolVfs({
    initialCapacity: 6,
    name: 'blood-opfs-sahpool',
    directory: '/blood-opfs-sahpool',
  });
};

type Pool = Awaited<ReturnType<typeof installPool>>;

let poolPromise: Promise<Pool> | null = null;
let activeDatabase: Database | null = null;
let schemaInitialized = false;
let requestQueue: Promise<void> = Promise.resolve();

const getPool = () => {
  if (!poolPromise) {
    poolPromise = installPool().catch((error) => {
      poolPromise = null;
      throw error;
    });
  }

  return poolPromise;
};

const initializeSchema = async (db: Database) => {
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

    CREATE TABLE IF NOT EXISTS registration_draft (
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

    CREATE TABLE IF NOT EXISTS registration_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipient_id INTEGER NOT NULL,
      values_json TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY(recipient_id) REFERENCES recipients(id)
    );

    CREATE TABLE IF NOT EXISTS blood_request_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipient_id INTEGER NOT NULL,
      kind TEXT NOT NULL,
      values_json TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY(recipient_id) REFERENCES recipients(id)
    );

    CREATE INDEX IF NOT EXISTS idx_recipients_name
      ON recipients(normalized_name);
    CREATE INDEX IF NOT EXISTS idx_protocol_records_recipient
      ON protocol_records(recipient_id, updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_registration_records_recipient
      ON registration_records(recipient_id, updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_blood_request_records_recipient_kind
      ON blood_request_records(recipient_id, kind, updated_at DESC);
  `);

  migrateRecipientNameConstraint(db);

  const sqlite3 = await getSqlite3();
  await migrateLegacyOpfsDepartments(sqlite3, db);
};

type LockManagerLike = {
  request: <T>(
    name: string,
    options: { mode: 'exclusive' },
    callback: () => Promise<T>,
  ) => Promise<T>;
};

const withOriginLock = async <T>(callback: () => Promise<T>) => {
  const lockManager = (
    globalThis.navigator as unknown as { locks?: LockManagerLike }
  ).locks;

  if (!lockManager) return callback();

  return lockManager.request(
    DATABASE_LOCK_NAME,
    { mode: 'exclusive' },
    callback,
  );
};

const enqueue = <T>(callback: () => Promise<T>) => {
  const run = requestQueue.then(callback, callback);
  requestQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
};

const describeAccessConflict = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);

  if (
    message.includes('createSyncAccessHandle') ||
    message.includes('another open Access Handle') ||
    message.includes('Writable stream associated with the same file')
  ) {
    return new Error(
      'Локальная база данных занята другой старой вкладкой приложения. ' +
        'Закройте другие вкладки с приложением, обновите страницу и повторите действие.',
    );
  }

  return error instanceof Error ? error : new Error(message);
};

export type SqliteDatabase = Database;

export const getDatabase = async (): Promise<SqliteDatabase> => {
  if (!activeDatabase) {
    throw new Error('SQLite database is not active.');
  }

  return activeDatabase;
};

export const withDatabaseAccess = <T>(callback: () => Promise<T>) =>
  enqueue(() =>
    withOriginLock(async () => {
      let pool: Pool | null = null;
      let db: Database | null = null;

      try {
        pool = await getPool();

        if (pool.isPaused()) {
          await pool.unpauseVfs();
        }

        db = new pool.OpfsSAHPoolDb(DATABASE_FILE);
        activeDatabase = db;

        if (!schemaInitialized) {
          await initializeSchema(db);
          schemaInitialized = true;
        }

        return await callback();
      } catch (error) {
        throw describeAccessConflict(error);
      } finally {
        activeDatabase = null;

        if (db) {
          try {
            db.close();
          } finally {
            pool?.pauseVfs();
          }
        } else {
          pool?.pauseVfs();
        }
      }
    }),
  );
