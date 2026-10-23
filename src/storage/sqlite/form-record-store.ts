import { getFormContentKey } from '../../domain/form-content';
import { normalizeComponentUnitNumber } from '../../domain/protocol-hemacon';
import type { SqliteDatabase } from './database';
import type { BloodRequestRecordKind } from './database-types';

type FormKind = 'protocol' | 'registration' | BloodRequestRecordKind;
type RecordRow = Record<string, unknown>;

const TABLES = new Map<FormKind, string>([
  ['protocol', 'protocol_records'],
  ['registration', 'registration_records'],
  ['component-request', 'blood_request_records'],
  ['individual-selection-direction', 'blood_request_records'],
]);

const readValues = (row: RecordRow): Record<string, unknown> | null => {
  try {
    const values: unknown = JSON.parse(String(row.valuesJson));
    return values && typeof values === 'object' && !Array.isArray(values)
      ? (values as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
};

export const withFormRecordTransaction = <T>(db: SqliteDatabase, write: () => T): T => {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = write();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
};

// All archive writes use this inside a transaction, including automatic saves.
export const storeFormRecord = (
  db: SqliteDatabase,
  {
    kind,
    recipientId,
    values,
    recordId,
  }: { kind: FormKind; recipientId: number; values: Record<string, unknown>; recordId?: number },
): RecordRow => {
  const table = TABLES.get(kind);
  if (!table) throw new Error('Неизвестный тип бланка.');
  const isRequest = table === 'blood_request_records';
  const select = `SELECT id, recipient_id AS recipientId, values_json AS valuesJson,
    created_at AS createdAt, updated_at AS updatedAt${isRequest ? ', kind' : ''} FROM ${table}`;
  const rows = db.exec({
    sql: `${select} WHERE recipient_id = $recipientId${isRequest ? ' AND kind = $kind' : ''}
      ORDER BY updated_at DESC, id DESC`,
    bind: { $recipientId: recipientId, ...(isRequest ? { $kind: kind } : {}) },
    rowMode: 'object',
    returnValue: 'resultRows',
  }) as RecordRow[];
  const contentKey = getFormContentKey(values);
  const number = normalizeComponentUnitNumber(String(values.componentUnitNumber ?? ''));
  const candidates = rows.flatMap((row) => {
    const stored = readValues(row);
    return stored ? [{ row, values: stored }] : [];
  });
  const selected =
    recordId === undefined ? undefined : candidates.find(({ row }) => Number(row.id) === recordId);
  if (recordId !== undefined && !selected) {
    throw new Error('Сохранённый бланк удалён или относится к другому реципиенту.');
  }
  if (
    selected &&
    candidates.some(
      (candidate) =>
        Number(candidate.row.id) !== recordId &&
        (getFormContentKey(candidate.values) === contentKey ||
          (kind === 'protocol' &&
            normalizeComponentUnitNumber(String(candidate.values.componentUnitNumber ?? '')) ===
              number)),
    )
  ) {
    throw new Error(
      'У реципиента уже есть другой бланк с такими данными или номером гемакона. Изменения не сохранены.',
    );
  }
  const matchingUnit =
    kind === 'protocol'
      ? candidates.find(
          (candidate) =>
            normalizeComponentUnitNumber(String(candidate.values.componentUnitNumber ?? '')) ===
            number,
        )
      : undefined;
  const identical = selected
    ? getFormContentKey(selected.values) === contentKey
      ? selected
      : undefined
    : matchingUnit
      ? getFormContentKey(matchingUnit.values) === contentKey
        ? matchingUnit
        : undefined
      : candidates.find((candidate) => getFormContentKey(candidate.values) === contentKey);
  if (identical) return identical.row;

  const bind = { $values: JSON.stringify(values), $now: Date.now() };
  let id: number;
  if (selected || matchingUnit) {
    id = Number((selected ?? matchingUnit)!.row.id);
    db.exec({
      sql: `UPDATE ${table} SET values_json = $values, updated_at = $now WHERE id = $id`,
      bind: { ...bind, $id: id },
    });
  } else {
    db.exec({
      sql: `INSERT INTO ${table} (recipient_id, values_json, created_at, updated_at${isRequest ? ', kind' : ''})
        VALUES ($recipientId, $values, $now, $now${isRequest ? ', $kind' : ''})`,
      bind: { ...bind, $recipientId: recipientId, ...(isRequest ? { $kind: kind } : {}) },
    });
    const inserted = db.exec({
      sql: 'SELECT last_insert_rowid() AS id',
      rowMode: 'object',
      returnValue: 'resultRows',
    }) as Array<{ id: number }>;
    id = Number(inserted[0].id);
  }
  const saved = db.exec({
    sql: `${select} WHERE id = $id`,
    bind: { $id: id },
    rowMode: 'object',
    returnValue: 'resultRows',
  }) as RecordRow[];
  if (!saved[0]) throw new Error('Не удалось сохранить бланк.');
  return saved[0];
};
