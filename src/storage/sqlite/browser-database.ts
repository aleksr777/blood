import type { Database, Sqlite3Static } from '@sqlite.org/sqlite-wasm';
import {
  loadLegacySnapshot,
  saveLegacySnapshot,
  supportsSynchronousOpfs,
} from './legacy-browser-storage';

const DATABASE_FILE = '/blood.sqlite3';
let legacyDatabase: { db: Database; sqlite3: Sqlite3Static } | null = null;
let storageFailure: Error | null = null;

export const assertBrowserDatabaseHealthy = () => {
  if (storageFailure) throw storageFailure;
};

export const openBrowserDatabase = async (sqlite3: Sqlite3Static) => {
  // An existing fallback database remains active after a browser update, so
  // saved documents do not disappear when the preferred OPFS API changes.
  const snapshot = await loadLegacySnapshot();
  if (snapshot !== undefined || !(await supportsSynchronousOpfs())) {
    if (snapshot) sqlite3.capi.sqlite3_js_posix_create_file(DATABASE_FILE, snapshot);
    return { db: new sqlite3.oo1.DB(DATABASE_FILE) as Database, legacy: true };
  }

  const pool = await sqlite3.installOpfsSAHPoolVfs({
    initialCapacity: 6,
    name: 'blood-opfs-sahpool',
    directory: '/blood-opfs-sahpool',
  });
  return { db: new pool.OpfsSAHPoolDb(DATABASE_FILE) as Database, legacy: false };
};

export const activateLegacyDatabase = async (sqlite3: Sqlite3Static, db: Database) => {
  await saveLegacySnapshot(sqlite3.capi.sqlite3_js_db_export(db.pointer!));
  legacyDatabase = { db, sqlite3 };
};

export const persistLegacyDatabase = async () => {
  if (!legacyDatabase) return;
  if (storageFailure) throw storageFailure;
  const { db, sqlite3 } = legacyDatabase;
  try {
    await saveLegacySnapshot(sqlite3.capi.sqlite3_js_db_export(db.pointer!));
  } catch {
    storageFailure = new Error(
      'Не удалось сохранить данные в браузере. Проверьте свободное место и перезагрузите страницу. Последняя операция не сохранена.',
    );
    throw storageFailure;
  }
};
