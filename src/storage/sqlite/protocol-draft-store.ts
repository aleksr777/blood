import { getDatabase } from './database';

type ProtocolDraft = Record<string, string>;

const isProtocolDraft = (value: unknown): value is ProtocolDraft =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  Object.values(value).every((item) => typeof item === 'string');

export const loadProtocolDraft = async (): Promise<ProtocolDraft> => {
  const db = await getDatabase();
  const rows = db.exec({
    sql: 'SELECT values_json FROM protocol_draft WHERE id = 1',
    rowMode: 'object',
    returnValue: 'resultRows',
  }) as Array<{ values_json: string }>;

  const serialized = rows[0]?.values_json;
  if (!serialized) return {};

  try {
    const parsed: unknown = JSON.parse(serialized);
    return isProtocolDraft(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

export const saveProtocolDraft = async (values: ProtocolDraft) => {
  const db = await getDatabase();
  db.exec({
    sql: `
      INSERT INTO protocol_draft (id, values_json, updated_at)
      VALUES (1, $values, $now)
      ON CONFLICT(id) DO UPDATE SET
        values_json = excluded.values_json,
        updated_at = excluded.updated_at
    `,
    bind: { $values: JSON.stringify(values), $now: Date.now() },
  });
};

export const clearProtocolDraft = async () => {
  const db = await getDatabase();
  db.exec('DELETE FROM protocol_draft WHERE id = 1');
};
