// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { adoptCurrentRecipientFromValues } from '../../storage/repositories/current-recipient';
import { IndividualSelectionDirection } from './individual-selection-direction';

vi.mock('../modal/modal', () => ({
  default: ({ title, children }: { title: string; children: ReactNode }) => (
    <section role="dialog" aria-label={title}>
      {children}
    </section>
  ),
}));

vi.mock('../../storage/sqlite/database-client', () => ({
  database: {
    loadProtocolDraft: vi.fn(async () => ({ values: {}, protocolRecordId: null, updatedAt: 0 })),
    listProtocolRecords: vi.fn(async () => []),
    listSavedOptions: vi.fn(async () => []),
    listDepartments: vi.fn(async () => []),
    saveBloodRequestRecord: vi.fn(),
  },
}));

const storageKey = 'blood:individual-selection-direction-draft';
const description = 'Аллоиммунные антитела к эритроцитам';
const stored = {
  sourceRecipientId: '1',
  recipientName: 'Текущий реципиент',
  recipientProfileSnapshot: { recipientId: '1', recipientName: 'Текущий реципиент' },
  requiredComponent: 'Отмытые эритроциты',
  quantity: '2',
  individualSelectionIndications: '',
  indicationValues: { componentGroup: 'erythrocytes', indicationComponent: 'erythrocytes' },
};

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
  window.localStorage.clear();
  window.sessionStorage.clear();
  adoptCurrentRecipientFromValues(stored.recipientProfileSnapshot);
  window.localStorage.setItem(storageKey, JSON.stringify(stored));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it('stores and prints only the description when a direction indication is chosen', async () => {
  const { container } = render(<IndividualSelectionDirection />);
  fireEvent.click(screen.getByRole('button', { name: /Наименование требуемого компонента:/ }));
  fireEvent.click(
    screen.getByRole('button', {
      name: 'Показать сохранённые варианты: Показания для индивидуального подбора',
    }),
  );
  fireEvent.click(screen.getByRole('button', { name: description }));
  await waitFor(() => {
    const draft = JSON.parse(window.localStorage.getItem(storageKey)!);
    expect(draft.individualSelectionIndications).toBe(description);
  });
  expect(container.querySelector('[data-document-paper]')?.textContent).toContain(description);
});

it('prints the description for an older direction draft containing a code', () => {
  window.localStorage.setItem(
    storageKey,
    JSON.stringify({ ...stored, individualSelectionIndications: '3' }),
  );
  const { container } = render(<IndividualSelectionDirection />);
  const printed = container.querySelector('[data-document-paper]')?.textContent ?? '';
  expect(printed).toContain(description);
  expect(printed).not.toContain('Показания для индивидуального подбора: 3');
});
