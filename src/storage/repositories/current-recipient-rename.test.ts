// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from 'vitest';
import {
  adoptCurrentRecipientFromValues,
  readCurrentRecipient,
  recipientProfileValuesForForms,
  syncCurrentRecipientProfile,
  updateCurrentRecipientProfile,
  type CurrentRecipient,
} from './current-recipient';
import { loadProtocolDraft } from './protocol-draft';
import { loadRegistrationDraft } from './registration-draft';
import { database } from '../sqlite/database-client';

vi.mock('../sqlite/database-client', () => ({
  database: {
    updateRecipient: vi.fn(),
    saveProtocolRecord: vi.fn(async () => ({})),
    saveRegistrationRecord: vi.fn(async () => ({})),
    saveBloodRequestRecord: vi.fn(async () => ({})),
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
  profile: { recipientBirthDate: '1980-01-02' },
};

beforeEach(() => {
  window.localStorage.clear();
  vi.clearAllMocks();
});

it.each(['protocol', 'request'] as const)(
  'persists a renamed patient from a %s form',
  async (kind) => {
    const values = recipientProfileValuesForForms(recipient);
    const fullName = 'Новое ФИО реципиента';
    const updated = {
      ...recipient,
      fullName,
      protocolCount: 0,
      registrationCount: 0,
      componentRequestCount: 0,
      individualSelectionDirectionCount: 0,
    };
    adoptCurrentRecipientFromValues(values);
    vi.mocked(database.updateRecipient).mockResolvedValue(updated);
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
    if (kind === 'protocol') {
      await syncCurrentRecipientProfile(
        { recipientName: fullName },
        { kind: 'protocol', values: { ...values, recipientName: fullName }, recordId: null },
      );
    } else {
      await updateCurrentRecipientProfile(recipient, { recipientName: fullName });
    }
    expect(database.updateRecipient).toHaveBeenCalledWith(
      recipient.id,
      expect.objectContaining({ recipientName: fullName }),
    );
    expect(readCurrentRecipient()?.fullName).toBe(fullName);
  },
);
