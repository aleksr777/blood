import { useEffect, useState } from 'react';
import { useSavedDocumentScope } from '../saved-document/saved-document-scope';
import {
  loadDepartments,
  removeDepartment,
  renameDepartment,
  type DepartmentRecord,
} from '../../storage/repositories/departments';

export const useDepartmentHistory = (value: string, onChange: (value: string) => void) => {
  const isolated = useSavedDocumentScope();
  const [history, setHistory] = useState<DepartmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  useEffect(() => {
    let active = true;

    void loadDepartments()
      .then((items) => {
        if (!active) return;
        setHistory(items);
        setLoadFailed(false);
      })
      .catch((error: unknown) => {
        console.error('Не удалось загрузить отделения:', error);
        if (active) setLoadFailed(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);
  const rename = async (item: DepartmentRecord, name: string) => {
    if (isolated) return;
    try {
      const nextName = name.trim();
      const items = await renameDepartment(item.id, nextName);
      setHistory(items);
      if (value === item.name) onChange(nextName);
    } catch (error) {
      console.error('Не удалось изменить отделение:', error);
    }
  };
  const remove = async (item: DepartmentRecord) => {
    if (isolated) return;
    const previousHistory = history;
    setHistory((current) => current.filter(({ id }) => id !== item.id));
    if (value === item.name) onChange('');

    try {
      setHistory(await removeDepartment(item.id));
    } catch (error) {
      setHistory(previousHistory);
      console.error('Не удалось удалить отделение:', error);
    }
  };
  return { history, loading, loadFailed, isolated, rename, remove };
};
