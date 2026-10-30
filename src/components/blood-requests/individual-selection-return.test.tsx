// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { database } from '../../storage/sqlite/database-client';
import { adoptCurrentRecipientFromValues } from '../../storage/repositories/current-recipient';
import { IndividualSelectionDirection } from './individual-selection-direction';

vi.mock('../../storage/sqlite/database-client', () => ({
  database: {
    loadProtocolDraft: vi.fn(async () => ({ values: {}, protocolRecordId: null, updatedAt: 0 })),
    listProtocolRecords: vi.fn(async () => []),
    saveBloodRequestRecord: vi.fn(),
  },
}));
const key = 'blood:individual-selection-direction-draft';
const profile = { recipientId: '1', recipientName: 'Текущий реципиент', diagnosis: 'Диагноз' };
const working = {
  sourceRecipientId: '1',
  recipientName: profile.recipientName,
  recipientProfileSnapshot: profile,
  requiredComponent: 'Отмытые эритроциты',
  quantity: '2',
  medicalOrganization: 'ЛПУ',
  directionDate: '2100-10-26',
  doctorName: 'Текущий врач',
  doctorPhone: '555',
  individualSelectionIndications: 'Показания к подбору',
  indicationValues: {
    componentGroup: 'erythrocytes',
    indicationComponent: 'erythrocytes',
    indications: 'Анемия',
  },
};
beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  adoptCurrentRecipientFromValues(profile);
  window.localStorage.setItem(key, JSON.stringify(working));
  vi.mocked(database.saveBloodRequestRecord).mockImplementation(async ({ values }) => ({
    id: 42,
    recipientId: 1,
    kind: 'individual-selection-direction',
    values,
    createdAt: 1,
    updatedAt: 1,
  }));
});
afterEach(cleanup);

const expectStaffCleared = async () => {
  await waitFor(() => {
    const next = JSON.parse(window.localStorage.getItem(key)!);
    expect([next.doctorName, next.doctorPhone]).toEqual(['', '']);
    for (const field of [
      'sourceRecipientId',
      'recipientName',
      'requiredComponent',
      'quantity',
      'medicalOrganization',
      'directionDate',
      'individualSelectionIndications',
    ] as const) {
      expect(next[field]).toEqual(working[field]);
    }
  });
};
it.each(['view', 'edit'] as const)('clears only staff when returning from %s', async (mode) => {
  window.sessionStorage.setItem(
    'blood:individual-selection-direction-open-record',
    JSON.stringify({
      record: {
        id: 42,
        recipientId: 2,
        kind: 'individual-selection-direction',
        values: { recipientName: 'Архивный реципиент' },
      },
      mode,
    }),
  );
  render(<IndividualSelectionDirection />);
  expect(screen.queryByRole('button', { name: 'Очистить бланк' })).toBeNull();
  fireEvent.click(
    screen.getByRole('button', {
      name: mode === 'view' ? 'Вернуться к текущему бланку' : 'Закрыть без сохранения',
    }),
  );
  await expectStaffCleared();
  expect(database.saveBloodRequestRecord).not.toHaveBeenCalled();
});

it('clears staff after saving while retaining the component, indications and date', async () => {
  render(<IndividualSelectionDirection />);
  fireEvent.click(screen.getByRole('button', { name: /^Сохранить$/ }));
  await screen.findByRole('button', { name: 'Закрыть без сохранения' });
  fireEvent.click(screen.getByRole('button', { name: 'Закрыть без сохранения' }));
  await expectStaffCleared();
  expect(database.saveBloodRequestRecord).toHaveBeenCalledOnce();
});
