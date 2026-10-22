import { SHARED_SAVED_OPTION_GROUPS } from '../../domain/shared-saved-options';
import { BLOOD_COMPONENTS, getBloodComponentNameCategory } from '../../domain/blood-components';
import { migrateLegacyComponentNames } from './legacy-component-names-migration';
import type { SqliteDatabase } from './database';

export const migrateSharedSavedOptions = (db: SqliteDatabase) => {
  const groups = [
    ...SHARED_SAVED_OPTION_GROUPS,
    ...BLOOD_COMPONENTS.map(({ value, legacyCategories }) => ({
      category: getBloodComponentNameCategory(value)!,
      fields: legacyCategories,
    })),
  ];
  db.exec('BEGIN IMMEDIATE');
  try {
    for (const { category, fields } of groups) {
      const categories = fields.map((_, index) => `$legacy${index}`).join(', ');
      const legacyBind = Object.fromEntries(
        fields.map((field, index) => [`$legacy${index}`, field]),
      );
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
        bind: { $category: category, ...legacyBind },
      });
      db.exec({
        sql: `DELETE FROM saved_options WHERE category IN (${categories})`,
        bind: legacyBind,
      });
    }
    migrateLegacyComponentNames(db);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
};
