import { getDatabase } from './database';
import type {
  ProtocolValuesRecord,
  RegistrationDraftState,
} from './database-types';

const isValues = (value: unknown): value is ProtocolValuesRecord =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  Object.values(value).every((item) => typeof item === 'string');

const emptyDraft = (): RegistrationDraftState => ({
  values: {},
  registrationRecordId: null,
  updatedAt: 0,
});

export const loadRegistrationDraft = async (): Promise<RegistrationDraftState> => {
  const db = await getDatabase();
  const rows = db.exec({
    sql: 'SELECT values_json, updated_at FROM registration_draft WHERE id = 1',
    rowMode: 'object',
    returnValue: 'resultRows',
  }) as Array<{ values_json: string; updated_at: number }>;

  const row = rows[0];
  if (!row?.values_json) return emptyDraft();

  try {
    const parsed: unknown = JSON.parse(row.values_json);
    if (isValues(parsed)) {
      return {
        values: parsed,
        registrationRecordId: null,
        updatedAt: Number(row.updated_at) || 0,
      };
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return emptyDraft();

    const state = parsed as Partial<RegistrationDraftState>;
    if (!isValues(state.values)) return emptyDraft();

    return {
      values: state.values,
      registrationRecordId:
        typeof state.registrationRecordId === 'number'
          ? state.registrationRecordId
          : null,
      updatedAt: Number(row.updated_at) || 0,
    };
  } catch {
    return emptyDraft();
  }
};

export const saveRegistrationDraft = async (state: RegistrationDraftState) => {
  const db = await getDatabase();
  db.exec({
    sql: `
      INSERT INTO registration_draft (id, values_json, updated_at)
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

export const clearRegistrationDraft = async () => {
  const db = await getDatabase();
  db.exec('DELETE FROM registration_draft WHERE id = 1');
};
