import { database } from '../sqlite/database-client';
import type { RegistrationDraftState } from '../sqlite/database-types';

export const loadRegistrationDraft = () => database.loadRegistrationDraft();

export const saveRegistrationDraft = (state: RegistrationDraftState) =>
  database.saveRegistrationDraft(state);

export const clearRegistrationDraft = () => database.clearRegistrationDraft();
