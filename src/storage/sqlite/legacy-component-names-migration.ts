import {
  getBloodComponentNameCategory,
  inferBloodComponentGroup,
} from '../../domain/blood-components';
import type { SqliteDatabase } from './database';

export const migrateLegacyComponentNames = (db: SqliteDatabase) => {
  const rows = db.exec({
    sql: `SELECT id, value FROM saved_options
      WHERE category IN ('componentName', 'componentRequestRequiredComponent:unselected')
      ORDER BY updated_at ASC, id ASC`,
    rowMode: 'object',
    returnValue: 'resultRows',
  }) as Array<{ id: number; value: string }>;

  for (const { id, value } of rows) {
    const category = getBloodComponentNameCategory(inferBloodComponentGroup(value));
    if (!category) continue;
    db.exec({
      sql: `INSERT INTO saved_options (category, value, normalized_value, created_at, updated_at)
        SELECT $category, value, normalized_value, created_at, updated_at
        FROM saved_options WHERE id = $id
        ON CONFLICT(category, normalized_value) DO UPDATE SET
          value = CASE WHEN excluded.updated_at >= saved_options.updated_at
            THEN excluded.value ELSE saved_options.value END,
          created_at = MIN(saved_options.created_at, excluded.created_at),
          updated_at = MAX(saved_options.updated_at, excluded.updated_at)`,
      bind: { $category: category, $id: id },
    });
    db.exec({ sql: 'DELETE FROM saved_options WHERE id = $id', bind: { $id: id } });
  }
};
