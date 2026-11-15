// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, vi } from 'vitest';
import type { ReactNode } from 'react';
import App from '../../app';
import { adoptCurrentRecipientFromValues } from '../../storage/repositories/current-recipient';
import type { ProtocolDraftState } from '../../storage/sqlite/database-types';

const storage = vi.hoisted(() => ({
  protocol: { values: {}, protocolRecordId: null, updatedAt: 1 } as ProtocolDraftState,
}));
vi.mock('../../storage/sqlite/database-client', () => ({
  database: {
    loadProtocolDraft: vi.fn(async () => structuredClone(storage.protocol)),
    saveProtocolDraft: vi.fn(async (draft: ProtocolDraftState) => {
      storage.protocol = structuredClone(draft);
    }),
    listProtocolRecords: vi.fn(async () => []),
    listSavedOptions: vi.fn(async () => []),
    listDepartments: vi.fn(async () => []),
  },
}));
vi.mock('../modal/modal', () => ({
  default: ({
    title,
    children,
    onClose,
  }: {
    title: string;
    children: ReactNode;
    onClose: () => void;
  }) => (
    <section role="dialog" aria-label={title}>
      <button onClick={onClose}>Close modal</button>
      {children}
    </section>
  ),
}));
vi.mock('../scrollbar/custom-scrollbar', () => ({ default: () => null }));

export const requestKey = 'blood:component-request-direction-draft';
export const directionKey = 'blood:individual-selection-direction-draft';
export const nameLabel = 'Наименование компонента донорской крови';
export const codeLabel = 'Идентификационный код (графа 6)';
const profile = { recipientId: '1', recipientName: 'Тестовый реципиент' };
const initialGroup = { componentGroup: 'erythrocytes', indicationComponent: 'erythrocytes' };
export const readDraft = (key: string) => JSON.parse(window.localStorage.getItem(key)!);

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.history.replaceState(null, '', '#/protocol');
  vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
  adoptCurrentRecipientFromValues(profile);
  storage.protocol = {
    values: { ...profile, ...initialGroup, componentName: 'Отмытые эритроциты' },
    protocolRecordId: null,
    updatedAt: Date.now(),
  };
  window.localStorage.setItem(
    requestKey,
    JSON.stringify({
      sourceRecipientId: '1',
      indicationValues: initialGroup,
      requiredComponent: 'Эритроцитная взвесь лейкоредуцированная',
      componentCode: 'ЭВ-Л',
    }),
  );
  window.localStorage.setItem(
    directionKey,
    JSON.stringify({
      sourceRecipientId: '1',
      indicationValues: initialGroup,
      requiredComponent: 'Эритроцитная масса',
    }),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

export const navigate = async (name: string, hash: string) => {
  fireEvent.click(screen.getByRole('link', { name }));
  await waitFor(() => expect(document.documentElement.dataset.appPage).toBe(hash));
};
export const openProtocol = () => {
  fireEvent.click(document.querySelector('[data-protocol-block="donor"]')!);
};
export const openRequest = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Количество (единицы измерения)' }));
};
export const openDirection = () => {
  fireEvent.click(screen.getByRole('button', { name: /Наименование требуемого компонента:/ }));
};
export const closeEditor = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Close modal' }));
export const expectSelection = async (group: string, name: string, coded = false) => {
  const dialog = within(await screen.findByRole('dialog'));
  await waitFor(() => {
    expect(dialog.getByRole('button', { name: group }).getAttribute('aria-pressed')).toBe('true');
    expect(
      (dialog.getByRole('textbox', { name: coded ? codeLabel : nameLabel }) as HTMLInputElement)
        .value,
    ).toBe(name);
  });
};

export const renderApp = () => render(<App />);
export const readProtocolDraft = () => storage.protocol;
