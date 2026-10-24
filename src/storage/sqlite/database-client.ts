import { requestDatabase as request, restartDatabaseWorker } from './database-worker-client';
import type { DatabaseStartupReporter, DatabaseStartupStage } from './database-startup';
import type {
  BloodRequestRecord,
  BloodRequestRecordKind,
  DatabaseAction,
  DepartmentRecord,
  ProtocolDraftState,
  ProtocolRecord,
  ProtocolValuesRecord,
  RecipientRecord,
  RegistrationDraftState,
  RegistrationRecord,
  SavedOptionRecord,
  SaveBloodRequestRecordInput,
} from './database-types';

let initialization: Promise<void> | null = null;
let startupStage: DatabaseStartupStage = 'worker';
const startupListeners = new Set<DatabaseStartupReporter>();
const reportStartup: DatabaseStartupReporter = (stage) => {
  startupStage = stage;
  startupListeners.forEach((listener) => listener(stage));
};

export const initializeDatabase = (onProgress?: DatabaseStartupReporter) => {
  if (onProgress) {
    startupListeners.add(onProgress);
    onProgress(startupStage);
  }
  initialization ??= (async () => {
    reportStartup('worker');
    await request<boolean>('init', undefined, reportStartup);
    try {
      void navigator.storage?.persist?.().catch(() => undefined);
    } catch {
      // Persistence permission is optional; OPFS can still be available.
    }
  })().catch((error: unknown) => {
    restartDatabaseWorker();
    initialization = null;
    throw error;
  });

  return onProgress
    ? initialization.finally(() => startupListeners.delete(onProgress))
    : initialization;
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
  removeDepartment: (id: number) => withDatabase<DepartmentRecord[]>('departments:remove', { id }),
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
  resetWorkingDrafts: () => withDatabase<void>('working-drafts:reset'),
  loadProtocolDraft: () => withDatabase<ProtocolDraftState>('protocol-draft:load'),
  saveProtocolDraft: (state: ProtocolDraftState) =>
    withDatabase<void>('protocol-draft:save', { state }),
  clearProtocolDraft: () => withDatabase<void>('protocol-draft:clear'),
  loadRegistrationDraft: () => withDatabase<RegistrationDraftState>('registration-draft:load'),
  saveRegistrationDraft: (state: RegistrationDraftState) =>
    withDatabase<void>('registration-draft:save', { state }),
  clearRegistrationDraft: () => withDatabase<void>('registration-draft:clear'),
  searchRecipients: (query: string) =>
    withDatabase<RecipientRecord[]>('recipients:search', { query }),
  getRecipientById: (id: number) => withDatabase<RecipientRecord>('recipients:get', { id }),
  findRecipientsByName: (fullName: string) =>
    withDatabase<RecipientRecord[]>('recipients:find-name', { fullName }),
  createRecipient: (fullName: string) =>
    withDatabase<RecipientRecord>('recipients:create', { fullName }),
  updateRecipient: (id: number, values: ProtocolValuesRecord) =>
    withDatabase<RecipientRecord>('recipients:update', { id, values }),
  removeRecipient: (id: number) => withDatabase<void>('recipients:remove', { id }),
  listProtocolRecords: (recipientId: number) =>
    withDatabase<ProtocolRecord[]>('protocol-records:list', { recipientId }),
  saveProtocolRecord: (values: ProtocolValuesRecord) =>
    withDatabase<ProtocolRecord>('protocol-records:save', { values }),
  updateProtocolRecord: (recordId: number, values: ProtocolValuesRecord) =>
    withDatabase<ProtocolRecord>('protocol-records:save', { recordId, values }),
  removeProtocolRecord: (id: number) => withDatabase<void>('protocol-records:remove', { id }),
  listRegistrationRecords: (recipientId: number) =>
    withDatabase<RegistrationRecord[]>('registration-records:list', { recipientId }),
  saveRegistrationRecord: (values: ProtocolValuesRecord) =>
    withDatabase<RegistrationRecord>('registration-records:save', { values }),
  updateRegistrationRecord: (recordId: number, values: ProtocolValuesRecord) =>
    withDatabase<RegistrationRecord>('registration-records:save', { recordId, values }),
  removeRegistrationRecord: (id: number) =>
    withDatabase<void>('registration-records:remove', { id }),
  listBloodRequestRecords: (recipientId: number, kind: BloodRequestRecordKind) =>
    withDatabase<BloodRequestRecord[]>('blood-request-records:list', {
      recipientId,
      kind,
    }),
  saveBloodRequestRecord: (input: SaveBloodRequestRecordInput) =>
    withDatabase<BloodRequestRecord>('blood-request-records:save', input),
  removeBloodRequestRecord: (id: number) =>
    withDatabase<void>('blood-request-records:remove', { id }),
};
