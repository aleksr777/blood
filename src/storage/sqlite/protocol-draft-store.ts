import { getDatabase } from './database';
import type { ProtocolDraftState, ProtocolValuesRecord } from './database-types';

const isValues = (value: unknown): value is ProtocolValuesRecord =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  Object.values(value).every((item) => typeof item === 'string');

const emptyDraft = (): ProtocolDraftState => ({
  values: {},
  protocolRecordId: null,
  updatedAt: 0,
});

export const loadProtocolDraft = async (): Promise<ProtocolDraftState> => {
  const db = await getDatabase();
  const rows = db.exec({
    sql: 'SELECT values_json, updated_at FROM protocol_draft WHERE id = 1',
    rowMode: 'object',
    returnValue: 'resultRows',
  }) as Array<{ values_json: string; updated_at: number }>;

  const row = rows[0];
  if (!row?.values_json) return emptyDraft();

  try {
    const parsed: unknown = JSON.parse(row.values_json);
    if (isValues(parsed)) {
      return { values: parsed, protocolRecordId: null, updatedAt: Number(row.updated_at) };
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return emptyDraft();

    const state = parsed as Partial<ProtocolDraftState>;
    if (!isValues(state.values)) return emptyDraft();
    return {
      values: state.values,
      protocolRecordId:
        typeof state.protocolRecordId === 'number' ? state.protocolRecordId : null,
      updatedAt: Number(row.updated_at) || 0,
    };
  } catch {
    return emptyDraft();
  }
};

export const saveProtocolDraft = async (state: ProtocolDraftState) => {
  const db = await getDatabase();
  db.exec({
    sql: `
      INSERT INTO protocol_draft (id, values_json, updated_at)
      VALUES (1, $values, $updatedAt)
      ON CONFLICT(id) DO UPDATE SET
        values_json = excluded.values_json,
        updated_at = excluded.updated_at
    `,
    bind: {
      $values: JSON.stringify(state),
      $updatedAt: state.updatedAt,
    },
  });
};

export const clearProtocolDraft = async () => {
  const db = await getDatabase();
  db.exec('DELETE FROM protocol_draft WHERE id = 1');
};
