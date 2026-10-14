import {
  loadProtocolDraft,
  saveProtocolDraft,
} from './protocol-draft';
import {
  loadRegistrationDraft,
  saveRegistrationDraft,
} from './registration-draft';
import {
  saveProtocolRecord,
  saveRegistrationRecord,
  type RecipientRecord,
} from './recipients';
import { profileFromValues } from '../sqlite/recipient-data';
import type {
  ProtocolDraftState,
  ProtocolValuesRecord,
  RegistrationDraftState,
} from '../sqlite/database-types';

const CURRENT_RECIPIENT_STORAGE_KEY = 'blood:current-recipient';

const protocolRecipientOnlyFields = new Set([
  'recipientId',
  'recipientName',
  'recipientAbo',
  'recipientRh',
  'recipientAntigens',
  'recipientAntigenC',
  'recipientAntigenc',
  'recipientAntigenCw',
  'recipientAntigenE',
  'recipientAntigene',
  'recipientAntigenK',
  'recipientAntigenk',
  'alloimmuneAntibodies',
  'alloimmuneAntibodyStatus',
  'alloimmuneAntibodyDescription',
  'previousTransfusionsStatus',
  'previousTransfusions',
  'previousReactionsStatus',
  'previousReactions',
  'individualSelectionHistoryStatus',
  'individualSelectionHistory',
  'reagentAntiASeries',
  'reagentAntiAExpiration',
  'reagentAntiAManufacturer',
  'reagentAntiBSeries',
  'reagentAntiBExpiration',
  'reagentAntiBManufacturer',
  'reagentAntiABSeries',
  'reagentAntiABExpiration',
  'reagentAntiABManufacturer',
  'reagentAntiDSeries',
  'reagentAntiDExpiration',
  'reagentAntiDManufacturer',
]);

const registrationRecipientOnlyFields = new Set([
  'recipientId',
  'recipientName',
]);

const hasDocumentData = (
  values: ProtocolValuesRecord,
  ignoredFields: Set<string>,
) =>
  Object.entries(values).some(
    ([key, value]) => !ignoredFields.has(key) && value.trim() !== '',
  );

const getRecipientId = (values: ProtocolValuesRecord) => {
  const id = Number(values.recipientId);
  return Number.isFinite(id) && id > 0 ? id : null;
};

export type CurrentRecipient = {
  id: number;
  fullName: string;
  profile: ProtocolValuesRecord;
};

export type ActiveDraftOverride =
  | {
      kind: 'protocol';
      values: ProtocolValuesRecord;
      recordId: number | null;
    }
  | {
      kind: 'registration';
      values: ProtocolValuesRecord;
      recordId: number | null;
    };

export type RecipientSwitchResult = {
  changed: boolean;
  protocolSaved: boolean;
  registrationSaved: boolean;
  protocolValues: ProtocolValuesRecord;
  registrationValues: ProtocolValuesRecord;
};

export const readCurrentRecipient = (): CurrentRecipient | null => {
  try {
    const raw = window.localStorage.getItem(CURRENT_RECIPIENT_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<CurrentRecipient>;
    if (
      typeof parsed.id !== 'number' ||
      parsed.id <= 0 ||
      typeof parsed.fullName !== 'string' ||
      !parsed.fullName.trim()
    ) {
      return null;
    }

    const profile =
      parsed.profile &&
      typeof parsed.profile === 'object' &&
      !Array.isArray(parsed.profile)
        ? Object.fromEntries(
            Object.entries(parsed.profile).filter(
              (entry): entry is [string, string] => typeof entry[1] === 'string',
            ),
          )
        : {};

    return {
      id: parsed.id,
      fullName: parsed.fullName,
      profile,
    };
  } catch (error) {
    console.error('Не удалось прочитать текущего реципиента:', error);
    return null;
  }
};

const writeCurrentRecipient = (recipient: RecipientRecord) => {
  try {
    window.localStorage.setItem(
      CURRENT_RECIPIENT_STORAGE_KEY,
      JSON.stringify({
        id: recipient.id,
        fullName: recipient.fullName,
        profile: recipient.profile,
      }),
    );
  } catch (error) {
    console.error('Не удалось сохранить текущего реципиента:', error);
  }
};

export const adoptCurrentRecipientFromValues = (values: ProtocolValuesRecord) => {
  const id = getRecipientId(values);
  const fullName = values.recipientName?.trim();
  if (!id || !fullName) return null;

  const recipient: CurrentRecipient = {
    id,
    fullName,
    profile: profileFromValues(values),
  };

  try {
    window.localStorage.setItem(
      CURRENT_RECIPIENT_STORAGE_KEY,
      JSON.stringify(recipient),
    );
  } catch (error) {
    console.error('Не удалось восстановить текущего реципиента:', error);
  }

  return recipient;
};

const protocolValuesForRecipient = (recipient: RecipientRecord): ProtocolValuesRecord => ({
  ...recipient.profile,
  recipientId: String(recipient.id),
  recipientName: recipient.fullName,
});

const registrationValuesForRecipient = (
  recipient: RecipientRecord,
): ProtocolValuesRecord => ({
  recipientId: String(recipient.id),
  recipientName: recipient.fullName,
});

const savePreviousProtocol = async (draft: ProtocolDraftState, nextRecipientId: number) => {
  const recipientId = getRecipientId(draft.values);
  if (!recipientId || recipientId === nextRecipientId || !draft.values.recipientName?.trim()) {
    return false;
  }

  if (
    draft.protocolRecordId === null &&
    !hasDocumentData(draft.values, protocolRecipientOnlyFields)
  ) {
    return false;
  }

  await saveProtocolRecord(draft.protocolRecordId, draft.values);
  return true;
};

const savePreviousRegistration = async (
  draft: RegistrationDraftState,
  nextRecipientId: number,
) => {
  const recipientId = getRecipientId(draft.values);
  if (!recipientId || recipientId === nextRecipientId || !draft.values.recipientName?.trim()) {
    return false;
  }

  if (
    draft.registrationRecordId === null &&
    !hasDocumentData(draft.values, registrationRecipientOnlyFields)
  ) {
    return false;
  }

  await saveRegistrationRecord(draft.registrationRecordId, draft.values);
  return true;
};

export const switchCurrentRecipient = async (
  recipient: RecipientRecord,
  activeDraft?: ActiveDraftOverride,
): Promise<RecipientSwitchResult> => {
  let [protocolDraft, registrationDraft] = await Promise.all([
    loadProtocolDraft(),
    loadRegistrationDraft(),
  ]);

  if (activeDraft?.kind === 'protocol') {
    protocolDraft = {
      values: activeDraft.values,
      protocolRecordId: activeDraft.recordId,
      updatedAt: Date.now(),
    };
  } else if (activeDraft?.kind === 'registration') {
    registrationDraft = {
      values: activeDraft.values,
      registrationRecordId: activeDraft.recordId,
      updatedAt: Date.now(),
    };
  }

  const storedRecipient = readCurrentRecipient();
  const protocolRecipientId = getRecipientId(protocolDraft.values);
  const registrationRecipientId = getRecipientId(registrationDraft.values);
  const activeRecipientId =
    storedRecipient?.id ??
    protocolRecipientId ??
    registrationRecipientId;
  const hasConflictingDraft =
    (protocolRecipientId !== null && protocolRecipientId !== recipient.id) ||
    (registrationRecipientId !== null && registrationRecipientId !== recipient.id);

  if (activeRecipientId === recipient.id && !hasConflictingDraft) {
    const protocolValues = {
      ...protocolDraft.values,
      ...recipient.profile,
      recipientId: String(recipient.id),
      recipientName: recipient.fullName,
    };
    const registrationValues = {
      ...registrationDraft.values,
      recipientId: String(recipient.id),
      recipientName: recipient.fullName,
    };
    const now = Date.now();

    await Promise.all([
      saveProtocolDraft({
        values: protocolValues,
        protocolRecordId: protocolDraft.protocolRecordId,
        updatedAt: now,
      }),
      saveRegistrationDraft({
        values: registrationValues,
        registrationRecordId: registrationDraft.registrationRecordId,
        updatedAt: now,
      }),
    ]);

    writeCurrentRecipient(recipient);
    return {
      changed: false,
      protocolSaved: false,
      registrationSaved: false,
      protocolValues,
      registrationValues,
    };
  }

  const [protocolSaved, registrationSaved] = await Promise.all([
    savePreviousProtocol(protocolDraft, recipient.id),
    savePreviousRegistration(registrationDraft, recipient.id),
  ]);

  const protocolValues = protocolValuesForRecipient(recipient);
  const registrationValues = registrationValuesForRecipient(recipient);
  const now = Date.now();

  await Promise.all([
    saveProtocolDraft({
      values: protocolValues,
      protocolRecordId: null,
      updatedAt: now,
    }),
    saveRegistrationDraft({
      values: registrationValues,
      registrationRecordId: null,
      updatedAt: now,
    }),
  ]);

  writeCurrentRecipient(recipient);

  return {
    changed: true,
    protocolSaved,
    registrationSaved,
    protocolValues,
    registrationValues,
  };
};
