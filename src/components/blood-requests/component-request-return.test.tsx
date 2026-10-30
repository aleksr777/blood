// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { database } from '../../storage/sqlite/database-client';
import {
  adoptCurrentRecipientFromValues,
  readCurrentRecipient,
} from '../../storage/repositories/current-recipient';
import { ComponentRequest } from './component-request';

vi.mock('../../storage/sqlite/database-client', () => ({
  database: {
    loadProtocolDraft: vi.fn(async () => ({ values: {}, protocolRecordId: null, updatedAt: 0 })),
    saveBloodRequestRecord: vi.fn(),
  },
}));
const key = 'blood:component-request-direction-draft';
const profile = {
  recipientId: '1',
  recipientName: 'Рабочий реципиент',
  recipientSex: 'Мужской',
  medicalRecordNumber: '123',
  diagnosis: 'Рабочий диагноз',
  department: 'ОРИТ',
};
const working = {
  ...profile,
  sourceRecipientId: '1',
  recipientProfileSnapshot: profile,
  requiredComponent: 'Эритроцитная взвесь',
  componentAbo: 'A(II)',
  componentRh: 'Rh(+)',
  quantity: '2',
  transfusionOrder: 'planned',
  componentSelectionRequirement: 'individual',
  individualSelectionIndications: 'Рабочие показания к подбору',
  indicationValues: {
    componentGroup: 'erythrocytes',
    indicationComponent: 'erythrocytes',
    indications: 'Рабочие показания',
  },
  medicalOrganization: 'ЛПУ',
  directionDate: '2026-10-26',
  doctorName: 'Врач',
  doctorPhone: '12345',
};
beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  adoptCurrentRecipientFromValues(profile);
  window.localStorage.setItem(key, JSON.stringify(working));
  vi.mocked(database.saveBloodRequestRecord).mockImplementation(async ({ values }) => ({
    id: 42,
    recipientId: 1,
    kind: 'component-request',
    values,
    createdAt: 1,
    updatedAt: 1,
  }));
});
afterEach(cleanup);

const expectWorkingSelectionCleared = async () => {
  await waitFor(() => {
    const next = JSON.parse(window.localStorage.getItem(key)!);
    for (const field of ['requiredComponent', 'componentAbo', 'componentRh', 'quantity']) {
      expect(next[field]).toBe('');
    }
    for (const field of [
      'sourceRecipientId',
      'recipientName',
      'diagnosis',
      'medicalRecordNumber',
      'department',
      'medicalOrganization',
      'directionDate',
      'transfusionOrder',
      'componentSelectionRequirement',
      'individualSelectionIndications',
    ] as const) {
      expect(next[field]).toEqual(working[field]);
    }
    expect(next.doctorName).toBe('');
    expect(next.doctorPhone).toBeUndefined();
    expect(next.indicationValues.indications).toBe(working.indicationValues.indications);
  });
  expect(readCurrentRecipient()?.id).toBe(1);
};

it.each(['view', 'edit'] as const)(
  'clears only the working component details when returning from %s',
  async (mode) => {
    window.sessionStorage.setItem(
      'blood:component-request-open-record',
      JSON.stringify({
        record: {
          id: 42,
          recipientId: 2,
          kind: 'component-request',
          values: { recipientName: 'Архивный реципиент' },
        },
        mode,
      }),
    );
    render(<ComponentRequest />);
    fireEvent.click(screen.getByRole('button', { name: 'К созданию нового бланка' }));
    await expectWorkingSelectionCleared();
    expect(database.saveBloodRequestRecord).not.toHaveBeenCalled();
  },
);

it('preserves other request data when a working request is saved and closed', async () => {
  const { container } = render(<ComponentRequest />);
  fireEvent.click(screen.getByRole('button', { name: /^Сохранить$/ }));
  await screen.findByRole('button', { name: 'К созданию нового бланка' });
  expect(container.querySelector('main')?.getAttribute('data-document-mode')).toBe('edit');
  expect(screen.getByRole('button', { name: 'Сохранить' }).hasAttribute('disabled')).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'К созданию нового бланка' }));
  await expectWorkingSelectionCleared();
  expect(database.saveBloodRequestRecord).toHaveBeenCalledOnce();
  const saved = vi.mocked(database.saveBloodRequestRecord).mock.calls[0][0].values;
  expect(saved.requiredComponent).toBe(working.requiredComponent);
  expect(saved.doctorName).toBe(working.doctorName);
});
