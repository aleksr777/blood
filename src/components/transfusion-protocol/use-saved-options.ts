import { useEffect, useState } from 'react';
import {
  loadSavedOptions,
  removeSavedOption,
  renameSavedOption,
  subscribeSavedOptions,
  type SavedOptionRecord,
} from '../../storage/repositories/saved-options';
import { loadDepartments } from '../../storage/repositories/departments';

const normalize = (value: string) => value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('ru-RU');

type Props = {
  category: string;
  value: string;
  onChange: (value: string, previousOptionValue?: string) => void;
  isolated: boolean;
  departments: boolean;
};

export const useSavedOptions = ({ category, value, onChange, isolated, departments }: Props) => {
  const [items, setItems] = useState<SavedOptionRecord[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let active = true;
    setStatus('loading');
    const load = departments
      ? loadDepartments().then((rows) => rows.map(({ id, name }) => ({ id, value: name })))
      : loadSavedOptions(category);
    void load
      .then((nextItems) => {
        if (active) {
          setItems(nextItems);
          setStatus('ready');
        }
      })
      .catch((error: unknown) => {
        console.error(`Не удалось загрузить список ${category}:`, error);
        if (active) setStatus('error');
      });
    return () => {
      active = false;
    };
  }, [category, departments]);

  useEffect(() => {
    if (departments) return;
    return subscribeSavedOptions(category, ({ items: nextItems, edit }) => {
      setItems(nextItems);
      setStatus('ready');
      if (!isolated && edit && normalize(value) === normalize(edit.previousValue)) {
        onChange(edit.value, edit.previousValue);
      }
    });
  }, [category, value, onChange, isolated, departments]);

  const rename = async (item: SavedOptionRecord, nextValue: string) => {
    if (isolated) return;
    try {
      await renameSavedOption(category, item.id, nextValue.trim());
    } catch (error) {
      console.error(`Не удалось изменить значение ${category}:`, error);
    }
  };
  const remove = async (item: SavedOptionRecord) => {
    if (isolated) return;
    try {
      await removeSavedOption(category, item.id);
    } catch (error) {
      console.error(`Не удалось удалить значение ${category}:`, error);
    }
  };
  return { items, status, rename, remove };
};
