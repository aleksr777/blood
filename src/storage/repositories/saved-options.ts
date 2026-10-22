import { database } from '../sqlite/database-client';
import type { SavedOptionRecord } from '../sqlite/database-types';

export const loadSavedOptions = (category: string) => database.listSavedOptions(category);

type OptionsChange = {
  items: SavedOptionRecord[];
  edit?: { previousValue: string; value: string };
};

const listeners = new Map<string, Set<(change: OptionsChange) => void>>();

export const subscribeSavedOptions = (
  category: string,
  listener: (change: OptionsChange) => void,
) => {
  const subscribers = listeners.get(category) ?? new Set();
  subscribers.add(listener);
  listeners.set(category, subscribers);
  return () => {
    subscribers.delete(listener);
    if (!subscribers.size) listeners.delete(category);
  };
};

const publish = (category: string, change: OptionsChange) => {
  listeners.get(category)?.forEach((listener) => listener(change));
  return change.items;
};

export const rememberSavedOption = async (category: string, value: string) =>
  publish(category, { items: await database.rememberSavedOption(category, value) });

export const renameSavedOption = async (category: string, id: number, value: string) => {
  const previous = (await loadSavedOptions(category)).find((item) => item.id === id);
  const items = await database.renameSavedOption(category, id, value);
  return publish(category, {
    items,
    edit: previous
      ? { previousValue: previous.value, value: value.trim().replace(/\s+/g, ' ') }
      : undefined,
  });
};

export const removeSavedOption = async (category: string, id: number) => {
  const previous = (await loadSavedOptions(category)).find((item) => item.id === id);
  const items = await database.removeSavedOption(category, id);
  return publish(category, {
    items,
    edit: previous ? { previousValue: previous.value, value: '' } : undefined,
  });
};

export type { SavedOptionRecord };
