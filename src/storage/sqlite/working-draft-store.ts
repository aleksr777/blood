import { REAGENT_DEFAULT_FIELDS } from '../../domain/reagents';
import { getDatabase } from './database';
import { loadProtocolDraft } from './protocol-draft-store';

export const resetWorkingDrafts = async () => {
  const db = await getDatabase();
  const draft = await loadProtocolDraft();
  // A legacy archive reference must not become the source of shared reagent defaults.
  const reagents =
    draft.protocolRecordId === null
      ? Object.fromEntries(
          REAGENT_DEFAULT_FIELDS.flatMap((name) =>
            typeof draft.values[name] === 'string' ? [[name, draft.values[name]]] : [],
          ),
        )
      : {};

  db.transaction(() => {
    db.exec('DELETE FROM protocol_draft; DELETE FROM registration_draft');
    if (Object.keys(reagents).length > 0) {
      db.exec({
        sql: 'INSERT INTO protocol_draft (id, values_json, updated_at) VALUES (1, $values, $now)',
        bind: {
          $values: JSON.stringify({ values: reagents, protocolRecordId: null, updatedAt: 0 }),
          $now: 0,
        },
      });
    }
  });
};
