import { database } from '../sqlite/database-client';

export const loadProtocolDraft = () => database.loadProtocolDraft();

export const saveProtocolDraft = (values: Record<string, string>) =>
  database.saveProtocolDraft(values);

export const clearProtocolDraft = () => database.clearProtocolDraft();
