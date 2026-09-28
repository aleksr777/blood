import { database } from '../sqlite/database-client';
import type { SavedOptionRecord } from '../sqlite/database-types';

export const loadSavedOptions = (category: string) =>
  database.listSavedOptions(category);

export const rememberSavedOption = (category: string, value: string) =>
  database.rememberSavedOption(category, value);

export const renameSavedOption = (category: string, id: number, value: string) =>
  database.renameSavedOption(category, id, value);

export const removeSavedOption = (category: string, id: number) =>
  database.removeSavedOption(category, id);

export type { SavedOptionRecord };
