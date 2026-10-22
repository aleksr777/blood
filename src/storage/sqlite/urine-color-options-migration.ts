import { URINE_COLOR_FIELDS, URINE_COLOR_OPTION_CATEGORY } from '../../domain/urine-color-options';
import type { SqliteDatabase } from './database';

export const migrateUrineColorOptions = (db: SqliteDatabase) => {
  const categories = URINE_COLOR_FIELDS.map((_, index) => `$legacy${index}`).join(', ');
  const bind = Object.fromEntries([
    ['$category', URINE_COLOR_OPTION_CATEGORY],
    ...URINE_COLOR_FIELDS.map((field, index) => [`$legacy${index}`, field]),
  ]);

  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec({
      sql: `
        INSERT INTO saved_options (category, value, normalized_value, created_at, updated_at)
        SELECT $category, value, normalized_value, created_at, updated_at
        FROM saved_options WHERE category IN (${categories})
        ORDER BY updated_at ASC, id ASC
        ON CONFLICT(category, normalized_value) DO UPDATE SET
          value = CASE WHEN excluded.updated_at >= saved_options.updated_at
            THEN excluded.value ELSE saved_options.value END,
          created_at = MIN(saved_options.created_at, excluded.created_at),
          updated_at = MAX(saved_options.updated_at, excluded.updated_at)
      `,
      bind,
    });
    db.exec({
      sql: `DELETE FROM saved_options WHERE category IN (${categories})`,
      bind: Object.fromEntries(
        URINE_COLOR_FIELDS.map((field, index) => [`$legacy${index}`, field]),
      ),
    });
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
};
