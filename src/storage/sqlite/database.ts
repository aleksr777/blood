import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import { migrateLegacyOpfsDepartments } from './legacy-opfs-migration';
import { migrateRecipientNameConstraint } from './recipient-name-migration';

const DATABASE_FILE = '/blood.sqlite3';
const DATABASE_OWNER_LOCK = 'blood-opfs-sahpool-owner';

type LockManagerLike = {
  request: <T>(
    name: string,
    options: { mode: 'exclusive'; ifAvailable: true },
    callback: (lock: unknown | null) => Promise<T>,
  ) => Promise<T>;
};

let ownerLockPromise: Promise<void> | null = null;

const acquireDatabaseOwnerLock = () => {
  if (ownerLockPromise) return ownerLockPromise;

  const lockManager = (
    globalThis.navigator as unknown as { locks?: LockManagerLike }
  ).locks;

  if (!lockManager) {
    ownerLockPromise = Promise.resolve();
    return ownerLockPromise;
  }

  ownerLockPromise = new Promise<void>((resolve, reject) => {
    void lockManager
      .request(
        DATABASE_OWNER_LOCK,
        { mode: 'exclusive', ifAvailable: true },
        async (lock) => {
          if (!lock) {
            reject(
              new Error(
                'Приложение уже открыто в другой вкладке. ' +
                  'Закройте другие вкладки с приложением и повторите действие.',
              ),
            );
            return;
          }

          resolve();

          // Keep the lock for the lifetime of this worker. The browser
          // releases it automatically when the worker/tab is closed.
          await new Promise<void>(() => undefined);
        },
      )
      .catch(reject);
  });

  return ownerLockPromise;
};

const describeDatabaseError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);

  if (
    message.includes('createSyncAccessHandle') ||
    message.includes('another open Access Handle') ||
    message.includes('Writable stream associated with the same file')
  ) {
    return new Error(
      'Локальная база данных занята другой вкладкой или старой версией приложения. ' +
        'Закройте все вкладки с приложением, откройте его снова и повторите действие.',
    );
  }

  return error instanceof Error ? error : new Error(message);
};

const openDatabase = async () => {
  try {
    await acquireDatabaseOwnerLock();

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

    await migrateLegacyOpfsDepartments(sqlite3, db);
    return db;
  } catch (error) {
    throw describeDatabaseError(error);
  }
};

export type SqliteDatabase = Awaited<ReturnType<typeof openDatabase>>;

let databasePromise: ReturnType<typeof openDatabase> | null = null;

export const getDatabase = () => {
  databasePromise ??= openDatabase();
  return databasePromise;
};
