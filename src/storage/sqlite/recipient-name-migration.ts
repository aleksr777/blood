import type { SqliteDatabase } from './database';

type IndexRow = { name: string; unique: number; origin: string };

export const migrateRecipientNameConstraint = (db: SqliteDatabase) => {
  const indices = db.exec({
    sql: 'PRAGMA index_list(recipients)',
    rowMode: 'object',
    returnValue: 'resultRows',
  }) as IndexRow[];

  if (indices.some(({ unique, origin }) => unique === 1 && origin === 'u')) {
    const fk = db.exec({
      sql: 'PRAGMA foreign_keys',
      rowMode: 'object',
      returnValue: 'resultRows',
    }) as Array<{ foreign_keys: number }>;
    const fkEnabled = Boolean(fk[0]?.foreign_keys);
    if (fkEnabled) db.exec('PRAGMA foreign_keys = OFF');

    try {
      db.exec('BEGIN IMMEDIATE');
      db.exec(`
        CREATE TABLE recipients_without_name_constraint (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          full_name TEXT NOT NULL,
          normalized_name TEXT NOT NULL,
          birth_date TEXT NOT NULL DEFAULT '',
          profile_json TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        )
      `);
      db.exec(`
        INSERT INTO recipients_without_name_constraint
          (id, full_name, normalized_name, birth_date, profile_json, created_at, updated_at)
        SELECT id, full_name, normalized_name, birth_date, profile_json, created_at, updated_at
        FROM recipients
      `);
      db.exec('DROP TABLE recipients');
      db.exec('ALTER TABLE recipients_without_name_constraint RENAME TO recipients');
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    } finally {
      if (fkEnabled) db.exec('PRAGMA foreign_keys = ON');
    }
  }

  db.exec('DROP INDEX IF EXISTS idx_recipients_normalized_name_unique');
  db.exec('CREATE INDEX IF NOT EXISTS idx_recipients_name ON recipients(normalized_name)');
};
