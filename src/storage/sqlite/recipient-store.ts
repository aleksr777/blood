import { getDatabase } from './database';
import type { RecipientRecord } from './database-types';
import { normalizeKey, parseValues } from './recipient-data';

const searchDate = (query: string) => {
  const match = query.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : query;
};

const mapRecipient = (row: Record<string, unknown>): RecipientRecord => ({
  id: Number(row.id),
  fullName: String(row.fullName),
  birthDate: String(row.birthDate),
  profile: parseValues(String(row.profileJson)),
  protocolCount: Number(row.protocolCount ?? 0),
});

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
    bind: {
      $query: value,
      $like: `%${value}%`,
      $dateLike: `%${searchDate(value)}%`,
    },
    rowMode: 'object',
    returnValue: 'resultRows',
  }) as Array<Record<string, unknown>>;

  return rows.map(mapRecipient);
};
