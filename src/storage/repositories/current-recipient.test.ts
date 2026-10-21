// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  adoptCurrentRecipientFromValues,
  hasRecipientProfileDifference,
  mergeRecipientProfileValues,
  recipientProfileValuesForForms,
  readCurrentRecipient,
  switchCurrentRecipient,
  updateCurrentRecipientProfile,
  type CurrentRecipient,
} from './current-recipient';
import { loadProtocolDraft, saveProtocolDraft } from './protocol-draft';
import { loadRegistrationDraft, saveRegistrationDraft } from './registration-draft';
import { database } from '../sqlite/database-client';
import { disconnectCurrentRecipientFromCurrentForms } from './recipient-deletion';

vi.mock('../sqlite/database-client', () => ({
  database: {
    updateRecipient: vi.fn(),
    saveProtocolRecord: vi.fn(async () => ({})),
    saveRegistrationRecord: vi.fn(async () => ({})),
  },
}));
vi.mock('./protocol-draft', () => ({
  loadProtocolDraft: vi.fn(),
  saveProtocolDraft: vi.fn(),
}));
vi.mock('./registration-draft', () => ({
  loadRegistrationDraft: vi.fn(),
  saveRegistrationDraft: vi.fn(),
}));

const recipient: CurrentRecipient = {
  id: 1,
  fullName: 'Тестовый Реципиент',
  profile: { recipientBirthDate: '1980-01-02', diagnosis: 'Актуальный диагноз' },
};
const generatedHistory = {
  previousTransfusionsStatus: 'had',
  previousTransfusions: '20.10.2026 — Компонент, 250 мл',
  previousTransfusionsAutoText: '20.10.2026 — Компонент, 250 мл',
};

beforeEach(() => window.localStorage.clear());

describe('current recipient profile', () => {
  it.each(['switch', 'disconnect'] as const)(
    'finishes pending profile edits before %s',
    async (action) => {
      const values = recipientProfileValuesForForms(recipient);
      adoptCurrentRecipientFromValues(values);
      vi.mocked(loadProtocolDraft).mockResolvedValue({
        values,
        protocolRecordId: null,
        updatedAt: Date.now(),
      });
      vi.mocked(loadRegistrationDraft).mockResolvedValue({
        values,
        registrationRecordId: null,
        updatedAt: Date.now(),
      });
      const counts = {
        protocolCount: 0,
        registrationCount: 0,
        componentRequestCount: 0,
        individualSelectionDirectionCount: 0,
      };
      const updated = {
        ...recipient,
        ...counts,
        profile: { ...recipient.profile, medicalRecordNumber: '123' },
      };
      let finishUpdate = () => undefined as void;
      vi.mocked(database.updateRecipient).mockImplementation(
        () =>
          new Promise((resolve) => {
            finishUpdate = () => resolve(updated);
          }),
      );
      const editing = updateCurrentRecipientProfile(recipient, { medicalRecordNumber: '123' });
      let switched = false;
      const selection = (
        action === 'switch'
          ? switchCurrentRecipient({
              ...recipient,
              ...counts,
              id: 2,
              fullName: 'Другой Реципиент',
            })
          : disconnectCurrentRecipientFromCurrentForms(recipient.id)
      ).then(() => {
        switched = true;
      });
      await vi.waitFor(() => expect(database.updateRecipient).toHaveBeenCalled());
      expect(switched).toBe(false);
      finishUpdate();
      await Promise.all([editing, selection]);
      expect(readCurrentRecipient()?.id ?? null).toBe(action === 'switch' ? 2 : null);
    },
  );
  it('retains generated transfusion history when updating current recipient fields', () => {
    const merged = mergeRecipientProfileValues(
      {
        diagnosis: 'Старый диагноз',
        ...generatedHistory,
      },
      recipient,
    );
    expect(merged).toMatchObject({ ...generatedHistory, diagnosis: 'Актуальный диагноз' });
  });

  it('does not mark a saved form as edited just because it contains generated history', () => {
    const values = { ...recipientProfileValuesForForms(recipient), ...generatedHistory };
    expect(hasRecipientProfileDifference(values, recipient)).toBe(false);
    expect(hasRecipientProfileDifference({ ...values, diagnosis: 'Изменён' }, recipient)).toBe(
      true,
    );
  });

  it('preserves generated history and the saved record ID when reselecting the same recipient', async () => {
    const values = { ...recipientProfileValuesForForms(recipient), ...generatedHistory };
    adoptCurrentRecipientFromValues(values);
    vi.mocked(loadProtocolDraft).mockResolvedValue({
      values,
      protocolRecordId: 42,
      updatedAt: Date.now(),
    });
    vi.mocked(loadRegistrationDraft).mockResolvedValue({
      values: recipientProfileValuesForForms(recipient),
      registrationRecordId: null,
      updatedAt: Date.now(),
    });
    const result = await switchCurrentRecipient({
      ...recipient,
      protocolCount: 1,
      registrationCount: 0,
      componentRequestCount: 0,
      individualSelectionDirectionCount: 0,
    });
    expect(result.protocolValues).toMatchObject(generatedHistory);
    expect(result.protocolRecordId).toBe(42);
    expect(saveProtocolDraft).toHaveBeenCalled();
    expect(saveRegistrationDraft).toHaveBeenCalled();
  });

  it('saves the previous patient’s forms and clears transfusion data when selecting another patient', async () => {
    const oldValues = {
      ...recipientProfileValuesForForms(recipient),
      componentUnitNumber: '12345678901234',
      amountMl: '250',
      endTime: '12:00',
      donorAbo: 'A(II)',
      doctorName: 'Врач',
      reagentAntiASeries: '123',
    };
    adoptCurrentRecipientFromValues(oldValues);
    vi.mocked(loadProtocolDraft).mockResolvedValue({
      values: oldValues,
      protocolRecordId: null,
      updatedAt: Date.now(),
    });
    vi.mocked(loadRegistrationDraft).mockResolvedValue({
      values: { ...recipientProfileValuesForForms(recipient), registrationTransfusionRows: '[{}]' },
      registrationRecordId: null,
      updatedAt: Date.now(),
    });
    const result = await switchCurrentRecipient({
      ...recipient,
      id: 2,
      fullName: 'Другой Реципиент',
      protocolCount: 0,
      registrationCount: 0,
      componentRequestCount: 0,
      individualSelectionDirectionCount: 0,
    });
    expect(database.saveProtocolRecord).toHaveBeenCalledWith(oldValues);
    expect(result.protocolValues).toMatchObject({
      recipientId: '2',
      doctorName: 'Врач',
      reagentAntiASeries: '123',
    });
    expect(result.protocolValues.componentUnitNumber).toBeUndefined();
    expect(result.protocolValues.donorAbo).toBeUndefined();
    expect(result.protocolValues.endTime).toBeUndefined();
    expect(result.registrationValues.registrationTransfusionRows).toBeUndefined();
  });
});
