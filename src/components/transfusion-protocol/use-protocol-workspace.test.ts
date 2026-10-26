// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { database } from '../../storage/sqlite/database-client';
import { adoptCurrentRecipientFromValues } from '../../storage/repositories/current-recipient';
import { getProtocolNewBlankWarning } from '../../domain/protocol-hemacon';
import { useProtocolWorkspace } from './use-protocol-workspace';
import { clearProtocolHemacon } from '../saved-document/working-form-cleanup';

vi.mock('../../storage/sqlite/database-client', () => ({
  database: {
    loadProtocolDraft: vi.fn(),
    saveProtocolDraft: vi.fn(async () => undefined),
    clearProtocolDraft: vi.fn(async () => undefined),
    saveProtocolRecord: vi.fn(),
    updateProtocolRecord: vi.fn(),
    listProtocolRecords: vi.fn(async () => []),
  },
}));
const hemacon = {
  componentName: 'Эритроцитная взвесь',
  componentUnitNumber: '76102200045636',
  donorAbo: 'A(II)',
};
const recipient = { recipientId: '1', recipientName: 'Тестовый Реципиент' };
beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  adoptCurrentRecipientFromValues(recipient);
  vi.mocked(database.listProtocolRecords).mockResolvedValue([]);
  vi.mocked(database.saveProtocolRecord).mockImplementation(async (values) => ({
    id: 7,
    recipientId: 1,
    values,
    createdAt: 1000,
    updatedAt: 1000,
  }));
});

it('opening and printing an archive never merge current data or save an archived copy', async () => {
  const original = {
    id: 42,
    recipientId: 2,
    values: {
      recipientId: '2',
      recipientName: 'Архивный реципиент',
      diagnosis: 'Старый диагноз',
      ...hemacon,
    },
    createdAt: 1000,
    updatedAt: 1000,
  };
  const { result } = await openDraft({ ...hemacon, diagnosis: 'Рабочий диагноз' });
  const working = structuredClone(result.current.values);
  await act(async () => result.current.openRecord(original));
  expect(result.current.document.mode).toBe('view');
  expect(result.current.newBlankWarning).toBe('');
  expect(result.current.values).toEqual(original.values);
  act(() => result.current.saveValues({ diagnosis: 'Автозамена' }));
  expect(result.current.values).toEqual(original.values);
  await act(async () => result.current.saveToDatabase(true));
  expect(database.saveProtocolRecord).not.toHaveBeenCalled();
  expect(database.updateProtocolRecord).not.toHaveBeenCalled();
  expect(result.current.document.workingValues).toEqual(working);
  act(() => result.current.document.close());
  expect(result.current.values).toEqual(clearProtocolHemacon(working));
});

it('archive editing updates its ID and keeps working data until returning to the draft', async () => {
  const original = {
    id: 42,
    recipientId: 2,
    values: { recipientId: '2', recipientName: 'Архивный реципиент', ...hemacon },
    createdAt: 1000,
    updatedAt: 1000,
  };
  vi.mocked(database.updateProtocolRecord).mockImplementation(async (id, values) => ({
    ...original,
    id,
    values,
    updatedAt: 2000,
  }));
  const { result } = await openDraft({ ...hemacon, doctorName: 'Текущий врач' });
  const working = structuredClone(result.current.values);
  await act(async () => result.current.openRecord(original));
  act(() => result.current.document.edit());
  act(() => result.current.saveValues({ doctorName: 'Исправленный врач' }));
  await act(async () => result.current.saveToDatabase(true));
  expect(database.updateProtocolRecord).not.toHaveBeenCalled();
  await act(async () => result.current.saveToDatabase());
  expect(database.updateProtocolRecord).toHaveBeenCalledWith(42, {
    ...original.values,
    doctorName: 'Исправленный врач',
  });
  expect(database.saveProtocolRecord).not.toHaveBeenCalled();
  expect(result.current.document.mode).toBe('view');
  expect(result.current.document.workingValues).toEqual(working);
  act(() => result.current.document.close());
  expect(result.current.values).toEqual(clearProtocolHemacon(working));
});

it('retains non-hemacon protocol data after saving and returning to the working draft', async () => {
  const { result } = await openDraft({
    ...hemacon,
    transfusionDate: '2026-10-26',
    startTime: '10:00',
    indications: 'Рабочие показания',
    beforePulse: '70',
    doctorName: 'Текущий врач',
    nurseName: 'Текущая медсестра',
  });
  const working = structuredClone(result.current.values);
  await act(async () => result.current.saveToDatabase());
  expect(result.current.document.mode).toBe('view');
  expect(result.current.values).toEqual(working);
  act(() => result.current.document.close());
  expect(result.current.values).toEqual(clearProtocolHemacon(working));
  expect(database.saveProtocolRecord).toHaveBeenCalledTimes(1);
});
afterEach(cleanup);

const openDraft = async (values: Record<string, string>) => {
  vi.mocked(database.loadProtocolDraft).mockResolvedValue({
    values: { ...recipient, ...values },
    protocolRecordId: null,
    updatedAt: Date.now(),
  });
  const hook = renderHook(useProtocolWorkspace);
  await waitFor(() => expect(hook.result.current.values.recipientId).toBe('1'));
  return hook;
};

it.each<Record<string, string>>([
  { componentName: '' },
  { componentUnitNumber: '' },
  { componentUnitNumber: '761022' },
  { donorAbo: '' },
])('does not autosave an incomplete hemacon on New blank: %j', async (missing) => {
  const values = { ...hemacon, ...missing };
  const { result } = await openDraft(values);
  await act(async () => result.current.newBlank());
  expect(database.saveProtocolRecord).not.toHaveBeenCalled();
  expect(result.current.values).toMatchObject({ ...recipient, ...values });
  expect(result.current.status).toBe(getProtocolNewBlankWarning({ ...recipient, ...values }));
  expect(result.current.activeBlock).toBeNull();
});

it('keeps a recipient-only draft unchanged when New blank is blocked', async () => {
  const { result } = await openDraft({});
  const original = structuredClone(result.current.values);
  await act(async () => result.current.newBlank());
  expect(database.saveProtocolRecord).not.toHaveBeenCalled();
  expect(result.current.activeBlock).toBeNull();
  expect(result.current.values).toEqual(original);
  expect(result.current.status).toBe(getProtocolNewBlankWarning(original));
});

it('does not save or reset a complete hemacon without the recipient name', async () => {
  window.localStorage.clear();
  const { result } = await openDraft({ ...hemacon, recipientName: '' });
  const original = structuredClone(result.current.values);
  expect(original.recipientName).toBe('');
  await act(async () => result.current.newBlank());
  expect(database.saveProtocolRecord).not.toHaveBeenCalled();
  expect(result.current.values).toEqual(original);
  expect(result.current.status).toContain('ФИО реципиента');
});

it('autosaves a complete hemacon on New blank without requiring volume or expiration', async () => {
  const { result } = await openDraft({ ...hemacon, doctorName: 'Врач', nurseName: 'Медсестра' });
  await act(async () => result.current.newBlank());
  expect(database.saveProtocolRecord).toHaveBeenCalledTimes(1);
  expect(database.saveProtocolRecord).toHaveBeenCalledWith(expect.objectContaining(hemacon));
  expect(result.current.values).toMatchObject({
    ...recipient,
    doctorName: 'Врач',
    nurseName: 'Медсестра',
  });
  expect(result.current.values.componentUnitNumber).toBeUndefined();
  expect(result.current.recordId).toBeNull();
});

it('does not warn about saved unit number matches but still validates an incomplete number', async () => {
  vi.mocked(database.listProtocolRecords).mockResolvedValue([
    {
      id: 7,
      recipientId: 1,
      values: { ...recipient, ...hemacon },
      createdAt: 1000,
      updatedAt: 1000,
    },
  ]);
  const { result } = await openDraft(hemacon);
  await waitFor(() => expect(database.listProtocolRecords).toHaveBeenCalled());
  expect(result.current.componentUnitNumberWarning).toBe('');
  await act(async () => {
    result.current.saveValues({ componentUnitNumber: '761022' });
    result.current.validateComponentUnitNumber({ componentUnitNumber: '761022' });
  });
  expect(result.current.componentUnitNumberWarning).toContain('6 из 14 цифр');
});

it('retains every period when a shared color edit updates several fields in one batch', async () => {
  const colors = ['beforeUrineColor', 'hour1UrineColor', 'hour2UrineColor'];
  const { result } = await openDraft({
    ...hemacon,
    beforeUrine: '150',
    ...Object.fromEntries(colors.map((name) => [name, 'Жёлтая'])),
  });
  for (const value of ['Светло-жёлтая', '']) {
    await act(async () => {
      for (const name of colors) result.current.saveValues({ [name]: value });
    });
    expect(result.current.values).toMatchObject({
      ...hemacon,
      beforeUrine: '150',
      ...Object.fromEntries(colors.map((name) => [name, value])),
    });
  }
});

it('keeps mismatch warnings mandatory except for known O(I) Rh-negative erythrocytes', async () => {
  const { result } = await openDraft({ componentGroup: 'erythrocytes', donorAbo: 'B(III)' });
  await act(async () => result.current.saveValues({ recipientAbo: 'A(II)' }));
  expect(result.current.bloodGroupWarning).toContain('группа крови:');
  expect(result.current.bloodGroupWarningDismissible).toBe(false);
  act(() => result.current.dismissBloodGroupWarning());
  expect(result.current.bloodGroupWarning).toContain('не совпадают');
  await act(async () => result.current.saveValues({ donorAbo: 'O(I)', donorRh: 'Rh(-)' }));
  expect(result.current.bloodGroupWarningDismissible).toBe(true);
  act(() => result.current.dismissBloodGroupWarning());
  expect(result.current.bloodGroupWarning).toBe('');
  await act(async () => result.current.saveValues({ componentGroup: 'plasma-cryo' }));
  expect(result.current.bloodGroupWarningDismissible).toBe(false);
  expect(result.current.bloodGroupWarning).toContain('не совпадают');
  await act(async () => result.current.saveValues({ componentGroup: 'erythrocytes' }));
  expect(result.current.bloodGroupWarningDismissible).toBe(true);
  expect(result.current.bloodGroupWarning).toContain('не совпадают');
});

it('hides expiration notices in both saved modes and restores notices for the working draft', async () => {
  const expired = {
    ...hemacon,
    expirationDate: '2000-01-01',
    reagentAntiAExpiration: '2000-01-01',
  };
  const { result } = await openDraft(expired);
  expect(result.current.reagentWarning).toContain('истёк срок годности');
  await act(async () =>
    result.current.openRecord({
      id: 42,
      recipientId: 2,
      values: { ...recipient, ...expired },
      createdAt: 1000,
      updatedAt: 1000,
    }),
  );
  expect(result.current.reagentWarning).toBe('');
  act(() => result.current.document.edit());
  expect(result.current.reagentWarning).toBe('');
  act(() => result.current.document.close());
  expect(result.current.reagentWarning).toContain('истёк срок годности');
});
