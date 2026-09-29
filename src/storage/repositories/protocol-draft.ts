import { database } from '../sqlite/database-client';
import type { ProtocolDraftState } from '../sqlite/database-types';

export const loadProtocolDraft = () => database.loadProtocolDraft();

export const saveProtocolDraft = (state: ProtocolDraftState) =>
  database.saveProtocolDraft(state);

export const clearProtocolDraft = () => database.clearProtocolDraft();
