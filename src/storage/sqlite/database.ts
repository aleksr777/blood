import { initializeSchema } from './database-schema';
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import { migrateLegacyOpfsDepartments } from './legacy-opfs-migration';
import { migrateRecipientNameConstraint } from './recipient-name-migration';
import { DatabaseError, describeDatabaseError } from './database-errors';
import type { DatabaseStartupReporter } from './database-startup';
import { migrateSharedSavedOptions } from './shared-saved-options-migration';
import { activateLegacyDatabase, openBrowserDatabase } from './browser-database';

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

  const lockManager = (globalThis.navigator as unknown as { locks?: LockManagerLike }).locks;

  if (!lockManager) {
    ownerLockPromise = Promise.resolve();
    return ownerLockPromise;
  }

  ownerLockPromise = new Promise<void>((resolve, reject) => {
    void lockManager
      .request(DATABASE_OWNER_LOCK, { mode: 'exclusive', ifAvailable: true }, async (lock) => {
        if (!lock) {
          reject(
            new DatabaseError(
              'Приложение уже открыто в другой вкладке. ' +
                'Закройте другие вкладки с приложением и повторите действие.',
              'database-in-use',
            ),
          );
          return;
        }

        resolve();

        // Keep the lock for the lifetime of this worker. The browser
        // releases it automatically when the worker/tab is closed.
        await new Promise<void>(() => undefined);
      })
      .catch(reject);
  }).catch((error: unknown) => {
    ownerLockPromise = null;
    throw error;
  });

  return ownerLockPromise;
};

const openDatabase = async (onProgress?: DatabaseStartupReporter) => {
  try {
    onProgress?.('ownership');
    await acquireDatabaseOwnerLock();

    onProgress?.('sqlite');
    const sqlite3 = await sqlite3InitModule();
    onProgress?.('storage');
    const { db, legacy } = await openBrowserDatabase(sqlite3);

    onProgress?.('schema');
    initializeSchema(db);
    migrateSharedSavedOptions(db);

    migrateRecipientNameConstraint(db);

    onProgress?.('migration');
    if (!legacy) await migrateLegacyOpfsDepartments(sqlite3, db);
    if (legacy) await activateLegacyDatabase(sqlite3, db);
    return db;
  } catch (error) {
    throw describeDatabaseError(error);
  }
};

export type SqliteDatabase = Awaited<ReturnType<typeof openDatabase>>;

let databasePromise: ReturnType<typeof openDatabase> | null = null;

export const getDatabase = (onProgress?: DatabaseStartupReporter) => {
  databasePromise ??= openDatabase(onProgress).catch((error: unknown) => {
    databasePromise = null;
    throw error;
  });
  return databasePromise;
};
