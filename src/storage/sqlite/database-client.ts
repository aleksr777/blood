import type {
  DatabaseAction,
  DatabaseRequest,
  DatabaseResponse,
  DepartmentRecord,
  SavedOptionRecord,
} from './database-types';

type PendingRequest = {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
};

const worker = new Worker(new URL('./database.worker.ts', import.meta.url), { type: 'module' });
const pending = new Map<number, PendingRequest>();
let nextRequestId = 1;

const rejectPending = (error: Error) => {
  pending.forEach(({ reject }) => reject(error));
  pending.clear();
};

worker.addEventListener('error', (event) => {
  rejectPending(new Error(event.message || 'Не удалось запустить SQLite worker.'));
});

worker.addEventListener('message', (event: MessageEvent<DatabaseResponse>) => {
  const request = pending.get(event.data.id);
  if (!request) return;

  pending.delete(event.data.id);
  if (event.data.ok) request.resolve(event.data.result);
  else request.reject(new Error(event.data.error ?? 'Ошибка SQLite.'));
});

const request = <T>(action: DatabaseAction, payload?: unknown) => {
  const id = nextRequestId++;

  return new Promise<T>((resolve, reject) => {
    pending.set(id, {
      resolve: (value) => resolve(value as T),
      reject,
    });

    const message: DatabaseRequest = { id, action, payload };
    worker.postMessage(message);
  });
};

let initialization: Promise<void> | null = null;

export const initializeDatabase = () => {
  initialization ??= (async () => {
    await navigator.storage?.persist?.();
    await request<boolean>('init');
  })();

  return initialization;
};

const withDatabase = async <T>(action: DatabaseAction, payload?: unknown) => {
  await initializeDatabase();
  return request<T>(action, payload);
};

export const database = {
  listDepartments: () => withDatabase<DepartmentRecord[]>('departments:list'),
  rememberDepartment: (name: string) =>
    withDatabase<DepartmentRecord[]>('departments:remember', { name }),
  renameDepartment: (id: number, name: string) =>
    withDatabase<DepartmentRecord[]>('departments:rename', { id, name }),
  removeDepartment: (id: number) =>
    withDatabase<DepartmentRecord[]>('departments:remove', { id }),
  importDepartments: (names: string[]) =>
    withDatabase<DepartmentRecord[]>('departments:import', { names }),
  listSavedOptions: (category: string) =>
    withDatabase<SavedOptionRecord[]>('saved-options:list', { category }),
  rememberSavedOption: (category: string, value: string) =>
    withDatabase<SavedOptionRecord[]>('saved-options:remember', { category, value }),
  renameSavedOption: (category: string, id: number, value: string) =>
    withDatabase<SavedOptionRecord[]>('saved-options:rename', { category, id, value }),
  removeSavedOption: (category: string, id: number) =>
    withDatabase<SavedOptionRecord[]>('saved-options:remove', { category, id }),
  loadProtocolDraft: () =>
    withDatabase<Record<string, string>>('protocol-draft:load'),
  saveProtocolDraft: (values: Record<string, string>) =>
    withDatabase<void>('protocol-draft:save', { values }),
  clearProtocolDraft: () => withDatabase<void>('protocol-draft:clear'),
};
