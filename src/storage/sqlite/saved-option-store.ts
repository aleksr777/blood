import { getDatabase, type SqliteDatabase } from './database';
import type { SavedOptionRecord } from './database-types';

const normalize = (value: string) => value.trim().replace(/\s+/g, ' ');
const normalizeKey = (value: string) => normalize(value).toLocaleLowerCase('ru-RU');

const getRows = (db: SqliteDatabase, category: string) =>
  db.exec({
    sql: `
      SELECT id, value
      FROM saved_options
      WHERE category = $category
      ORDER BY updated_at DESC, id DESC
    `,
    bind: { $category: category },
    rowMode: 'object',
    returnValue: 'resultRows',
  }) as SavedOptionRecord[];

export const listSavedOptions = async (category: string) =>
  getRows(await getDatabase(), category);

export const rememberSavedOption = async (category: string, value: string) => {
  const nextValue = normalize(value);
  if (!nextValue) return listSavedOptions(category);

  const db = await getDatabase();
  const now = Date.now();
  db.exec({
    sql: `
      INSERT INTO saved_options (category, value, normalized_value, created_at, updated_at)
      VALUES ($category, $value, $normalizedValue, $now, $now)
      ON CONFLICT(category, normalized_value) DO UPDATE SET
        value = excluded.value,
        updated_at = excluded.updated_at
    `,
    bind: {
      $category: category,
      $value: nextValue,
      $normalizedValue: normalizeKey(nextValue),
      $now: now,
    },
  });

  return getRows(db, category);
};

export const renameSavedOption = async (category: string, id: number, value: string) => {
  const nextValue = normalize(value);
  const db = await getDatabase();

  if (!nextValue) {
    db.exec({ sql: 'DELETE FROM saved_options WHERE id = $id', bind: { $id: id } });
    return getRows(db, category);
  }

  const normalizedValue = normalizeKey(nextValue);
  const duplicate = db.exec({
    sql: `
      SELECT id FROM saved_options
      WHERE category = $category AND normalized_value = $normalizedValue
    `,
    bind: { $category: category, $normalizedValue: normalizedValue },
    rowMode: 'object',
    returnValue: 'resultRows',
  }) as Array<{ id: number }>;

  const duplicateId = duplicate[0]?.id;
  if (duplicateId && duplicateId !== id) {
    db.exec({
      sql: 'UPDATE saved_options SET value = $value, updated_at = $now WHERE id = $id',
      bind: { $value: nextValue, $now: Date.now(), $id: duplicateId },
    });
    db.exec({ sql: 'DELETE FROM saved_options WHERE id = $id', bind: { $id: id } });
  } else {
    db.exec({
      sql: `
        UPDATE saved_options
        SET value = $value, normalized_value = $normalizedValue, updated_at = $now
        WHERE id = $id
      `,
      bind: { $value: nextValue, $normalizedValue: normalizedValue, $now: Date.now(), $id: id },
    });
  }

  return getRows(db, category);
};

export const removeSavedOption = async (category: string, id: number) => {
  const db = await getDatabase();
  db.exec({ sql: 'DELETE FROM saved_options WHERE id = $id', bind: { $id: id } });
  return getRows(db, category);
};
