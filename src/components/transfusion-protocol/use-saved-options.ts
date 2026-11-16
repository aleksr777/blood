import { useEffect, useRef, useState } from 'react';
import {
  loadSavedOptions,
  removeSavedOption,
  renameSavedOption,
  subscribeSavedOptions,
  type SavedOptionRecord,
} from '../../storage/repositories/saved-options';
import {
  loadDepartments,
  removeDepartment,
  renameDepartment,
  type DepartmentRecord,
} from '../../storage/repositories/departments';

const normalize = (value: string) => value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('ru-RU');
const departmentOptions = (rows: DepartmentRecord[]) =>
  rows.map(({ id, name }) => ({ id, value: name }));

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
  const currentValue = useRef(value);
  currentValue.current = value;

  useEffect(() => {
    let active = true;
    setStatus('loading');
    const load = departments
      ? loadDepartments().then(departmentOptions)
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
    try {
      const trimmed = nextValue.trim().replace(/\s+/g, ' ');
      if (departments) {
        setItems(departmentOptions(await renameDepartment(item.id, trimmed)));
      } else {
        await renameSavedOption(category, item.id, trimmed);
      }
      if ((departments || isolated) && normalize(currentValue.current) === normalize(item.value))
        onChange(trimmed, item.value);
    } catch (error) {
      console.error(`Не удалось изменить значение ${category}:`, error);
    }
  };
  const remove = async (item: SavedOptionRecord) => {
    try {
      if (departments) {
        setItems(departmentOptions(await removeDepartment(item.id)));
      } else {
        await removeSavedOption(category, item.id);
      }
      if ((departments || isolated) && normalize(currentValue.current) === normalize(item.value))
        onChange('', item.value);
    } catch (error) {
      console.error(`Не удалось удалить значение ${category}:`, error);
    }
  };
  return { items, status, rename, remove };
};
