import { getDatabase, type SqliteDatabase } from './database';
import type {
  ProtocolRecord,
  ProtocolValuesRecord,
  RecipientRecord,
} from './database-types';

const PROFILE_FIELDS = [
  'recipientName',
  'recipientBirthDate',
  'recipientAbo',
  'recipientRh',
  'recipientAntigens',
  'alloimmuneAntibodies',
  'previousTransfusions',
  'previousReactions',
  'individualSelectionHistory',
];

const normalizeName = (value: string) => value.trim().replace(/\s+/g, ' ');
const normalizeKey = (value: string) => normalizeName(value).toLocaleLowerCase('ru-RU');
const parseValues = (value: string): ProtocolValuesRecord => {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
    );
  } catch {
    return {};
  }
};

const profileFromValues = (values: ProtocolValuesRecord) =>
  Object.fromEntries(
    PROFILE_FIELDS.flatMap((field) => (values[field] ? [[field, values[field]]] : [])),
  );

const mapRecipient = (row: Record<string, unknown>): RecipientRecord => ({
  id: Number(row.id),
  fullName: String(row.fullName),
  birthDate: String(row.birthDate),
  profile: parseValues(String(row.profileJson)),
  protocolCount: Number(row.protocolCount ?? 0),
});

const mapProtocol = (row: Record<string, unknown>): ProtocolRecord => ({
  id: Number(row.id),
  recipientId: Number(row.recipientId),
  values: parseValues(String(row.valuesJson)),
  createdAt: Number(row.createdAt),
  updatedAt: Number(row.updatedAt),
});

const searchDate = (query: string) => {
  const match = query.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : query;
};

export const searchRecipients = async (query: string) => {
  const db = await getDatabase();
  const value = normalizeKey(query);
  const rows = db.exec({
    sql: `
      SELECT r.id, r.full_name AS fullName, r.birth_date AS birthDate,
        r.profile_json AS profileJson, COUNT(p.id) AS protocolCount
      FROM recipients r
      LEFT JOIN protocol_records p ON p.recipient_id = r.id
      WHERE $query = ''
        OR r.normalized_name LIKE $like
        OR r.birth_date LIKE $dateLike
      GROUP BY r.id
      ORDER BY r.full_name, r.birth_date
      LIMIT 100
    `,
    bind: { $query: value, $like: `%${value}%`, $dateLike: `%${searchDate(value)}%` },
    rowMode: 'object',
    returnValue: 'resultRows',
  }) as Array<Record<string, unknown>>;

  return rows.map(mapRecipient);
};

export const listProtocolRecords = async (recipientId: number) => {
  const db = await getDatabase();
  const rows = db.exec({
    sql: `
      SELECT id, recipient_id AS recipientId, values_json AS valuesJson,
        created_at AS createdAt, updated_at AS updatedAt
      FROM protocol_records
      WHERE recipient_id = $recipientId
      ORDER BY updated_at DESC, id DESC
    `,
    bind: { $recipientId: recipientId },
    rowMode: 'object',
    returnValue: 'resultRows',
  }) as Array<Record<string, unknown>>;
  return rows.map(mapProtocol);
};

const upsertRecipient = (db: SqliteDatabase, values: ProtocolValuesRecord) => {
  const fullName = normalizeName(values.recipientName ?? '');
  const birthDate = values.recipientBirthDate ?? '';
  if (!fullName || !birthDate) throw new Error('Укажите ФИО и дату рождения реципиента.');

  const now = Date.now();
  db.exec({
    sql: `
      INSERT INTO recipients
        (full_name, normalized_name, birth_date, profile_json, created_at, updated_at)
      VALUES ($fullName, $normalizedName, $birthDate, $profile, $now, $now)
      ON CONFLICT(normalized_name, birth_date) DO UPDATE SET
        full_name = excluded.full_name,
        profile_json = excluded.profile_json,
        updated_at = excluded.updated_at
    `,
    bind: {
      $fullName: fullName,
      $normalizedName: normalizeKey(fullName),
      $birthDate: birthDate,
      $profile: JSON.stringify(profileFromValues(values)),
      $now: now,
    },
  });

  const rows = db.exec({
    sql: 'SELECT id FROM recipients WHERE normalized_name = $name AND birth_date = $birthDate',
    bind: { $name: normalizeKey(fullName), $birthDate: birthDate },
    rowMode: 'object',
    returnValue: 'resultRows',
  }) as Array<{ id: number }>;
  return Number(rows[0].id);
};

export const saveProtocolRecord = async (
  recordId: number | null,
  values: ProtocolValuesRecord,
) => {
  const db = await getDatabase();
  const recipientId = upsertRecipient(db, values);
  const now = Date.now();

  if (recordId) {
    db.exec({
      sql: `
        UPDATE protocol_records
        SET recipient_id = $recipientId, values_json = $values, updated_at = $now
        WHERE id = $id
      `,
      bind: { $recipientId: recipientId, $values: JSON.stringify(values), $now: now, $id: recordId },
    });
  } else {
    db.exec({
      sql: `
        INSERT INTO protocol_records (recipient_id, values_json, created_at, updated_at)
        VALUES ($recipientId, $values, $now, $now)
      `,
      bind: { $recipientId: recipientId, $values: JSON.stringify(values), $now: now },
    });
    const idRows = db.exec({
      sql: 'SELECT last_insert_rowid() AS id',
      rowMode: 'object',
      returnValue: 'resultRows',
    }) as Array<{ id: number }>;
    recordId = Number(idRows[0].id);
  }

  const rows = db.exec({
    sql: `
      SELECT id, recipient_id AS recipientId, values_json AS valuesJson,
        created_at AS createdAt, updated_at AS updatedAt
      FROM protocol_records WHERE id = $id
    `,
    bind: { $id: recordId },
    rowMode: 'object',
    returnValue: 'resultRows',
  }) as Array<Record<string, unknown>>;
  return mapProtocol(rows[0]);
};
