import type { DatabaseRequest, DatabaseResponse } from './database-types';
import { getDatabase } from './database';
import {
  importDepartments,
  listDepartments,
  rememberDepartment,
  removeDepartment,
  renameDepartment,
} from './department-store';
import {
  listSavedOptions,
  rememberSavedOption,
  removeSavedOption,
  renameSavedOption,
} from './saved-option-store';
import {
  clearProtocolDraft,
  loadProtocolDraft,
  saveProtocolDraft,
} from './protocol-draft-store';

const handleRequest = async (request: DatabaseRequest) => {
  switch (request.action) {
    case 'init':
      await getDatabase();
      return true;
    case 'departments:list':
      return listDepartments();
    case 'departments:remember':
      return rememberDepartment((request.payload as { name: string }).name);
    case 'departments:rename': {
      const payload = request.payload as { id: number; name: string };
      return renameDepartment(payload.id, payload.name);
    }
    case 'departments:remove':
      return removeDepartment((request.payload as { id: number }).id);
    case 'departments:import':
      return importDepartments((request.payload as { names: string[] }).names);
    case 'saved-options:list':
      return listSavedOptions((request.payload as { category: string }).category);
    case 'saved-options:remember': {
      const payload = request.payload as { category: string; value: string };
      return rememberSavedOption(payload.category, payload.value);
    }
    case 'saved-options:rename': {
      const payload = request.payload as { category: string; id: number; value: string };
      return renameSavedOption(payload.category, payload.id, payload.value);
    }
    case 'saved-options:remove': {
      const payload = request.payload as { category: string; id: number };
      return removeSavedOption(payload.category, payload.id);
    }
    case 'protocol-draft:load':
      return loadProtocolDraft();
    case 'protocol-draft:save':
      return saveProtocolDraft(
        (request.payload as { values: Record<string, string> }).values,
      );
    case 'protocol-draft:clear':
      return clearProtocolDraft();
  }
};

const send = (response: DatabaseResponse) => {
  const scope = globalThis as unknown as { postMessage: (message: DatabaseResponse) => void };
  scope.postMessage(response);
};

globalThis.addEventListener('message', (event: MessageEvent<DatabaseRequest>) => {
  void handleRequest(event.data)
    .then((result) => send({ id: event.data.id, ok: true, result }))
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      send({ id: event.data.id, ok: false, error: message });
    });
});
