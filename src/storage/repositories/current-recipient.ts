import { resetCurrentIndications } from './current-indications';
import { savePreviousRequestDrafts } from './request-drafts';
import { runRecipientOperation } from './recipient-operation-queue';
import { loadProtocolDraft, saveProtocolDraft } from './protocol-draft';
import { loadRegistrationDraft, saveRegistrationDraft } from './registration-draft';
import {
  saveProtocolRecord,
  saveRegistrationRecord,
  updateRecipient,
  type RecipientRecord,
} from './recipients';
import {
  mergeProfileValues,
  profileFromValues,
  RECIPIENT_PROFILE_FIELDS,
} from '../sqlite/recipient-data';
import type {
  ProtocolDraftState,
  ProtocolValuesRecord,
  RegistrationDraftState,
} from '../sqlite/database-types';

const CURRENT_RECIPIENT_STORAGE_KEY = 'blood:current-recipient';

const recipientProfileFieldSet = new Set<string>(RECIPIENT_PROFILE_FIELDS);

const protocolRecipientOnlyFields = new Set([
  'doctorName',
  'nurseName',
  'recipientId',
  'recipientName',
  ...RECIPIENT_PROFILE_FIELDS,
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
  ...RECIPIENT_PROFILE_FIELDS,
]);

const reusableProtocolValues = (values: ProtocolValuesRecord) =>
  Object.fromEntries(
    Object.entries(values).filter(
      ([name]) => name.startsWith('reagent') || name === 'doctorName' || name === 'nurseName',
    ),
  );

const hasDocumentData = (values: ProtocolValuesRecord, ignoredFields: Set<string>) =>
  Object.entries(values).some(([key, value]) => !ignoredFields.has(key) && value.trim() !== '');

const getRecipientId = (values: ProtocolValuesRecord) => {
  const id = Number(values.recipientId);
  return Number.isFinite(id) && id > 0 ? id : null;
};

const generatedTransfusionHistoryValues = (values: ProtocolValuesRecord): ProtocolValuesRecord => {
  if (!values.previousTransfusionsAutoText?.trim()) return {};

  return {
    previousTransfusionsStatus: values.previousTransfusionsStatus ?? '',
    previousTransfusions: values.previousTransfusions ?? '',
    previousTransfusionsAutoText: values.previousTransfusionsAutoText,
  };
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
  protocolRecordId: number | null;
  registrationRecordId: number | null;
};

export type RecipientProfileSyncResult = {
  recipient: RecipientRecord;
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

    const rawProfile =
      parsed.profile && typeof parsed.profile === 'object' && !Array.isArray(parsed.profile)
        ? Object.fromEntries(
            Object.entries(parsed.profile).filter(
              (entry): entry is [string, string] => typeof entry[1] === 'string',
            ),
          )
        : {};
    const profile = profileFromValues(rawProfile);

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

export const clearCurrentRecipientIfMatches = (recipientId: number) => {
  const current = readCurrentRecipient();
  if (!current || current.id !== recipientId) return false;

  try {
    window.localStorage.removeItem(CURRENT_RECIPIENT_STORAGE_KEY);
  } catch (error) {
    console.error('Не удалось очистить текущего реципиента:', error);
  }

  return true;
};

const writeCurrentRecipientSnapshot = (recipient: CurrentRecipient) => {
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

const writeCurrentRecipient = (recipient: RecipientRecord) => {
  writeCurrentRecipientSnapshot(recipient);
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
    window.localStorage.setItem(CURRENT_RECIPIENT_STORAGE_KEY, JSON.stringify(recipient));
  } catch (error) {
    console.error('Не удалось восстановить текущего реципиента:', error);
  }

  return recipient;
};

export const recipientProfileValuesForForms = (recipient: {
  id: number;
  fullName: string;
  profile: ProtocolValuesRecord;
}): ProtocolValuesRecord => ({
  ...Object.fromEntries(
    RECIPIENT_PROFILE_FIELDS.map((field) => [field, recipient.profile[field] ?? '']),
  ),
  recipientId: String(recipient.id),
  recipientName: recipient.fullName,
});

export const mergeRecipientProfileValues = (
  values: ProtocolValuesRecord,
  recipient: CurrentRecipient,
): ProtocolValuesRecord => ({
  ...values,
  ...recipientProfileValuesForForms(recipient),
  ...generatedTransfusionHistoryValues(values),
});

export const hasRecipientProfileDifference = (
  values: ProtocolValuesRecord,
  recipient: {
    id: number;
    fullName: string;
    profile: ProtocolValuesRecord;
  },
) => {
  const profileValues = recipientProfileValuesForForms(recipient);
  return Object.entries(profileValues).some(([field, value]) => {
    if (
      values.previousTransfusionsAutoText?.trim() &&
      (field === 'previousTransfusionsStatus' || field === 'previousTransfusions')
    )
      return false;
    return (values[field] ?? '') !== value;
  });
};

const savePreviousProtocol = async (draft: ProtocolDraftState, nextRecipientId: number) => {
  const recipientId = getRecipientId(draft.values);
  if (!recipientId || recipientId === nextRecipientId || !draft.values.recipientName?.trim()) {
    return false;
  }

  if (draft.protocolRecordId !== null) return false;

  if (!hasDocumentData(draft.values, protocolRecipientOnlyFields)) {
    return false;
  }

  await saveProtocolRecord(draft.values);
  return true;
};

const savePreviousRegistration = async (draft: RegistrationDraftState, nextRecipientId: number) => {
  const recipientId = getRecipientId(draft.values);
  if (!recipientId || recipientId === nextRecipientId || !draft.values.recipientName?.trim()) {
    return false;
  }

  if (draft.registrationRecordId !== null) return false;

  if (!hasDocumentData(draft.values, registrationRecipientOnlyFields)) {
    return false;
  }

  await saveRegistrationRecord(draft.values);
  return true;
};

const syncRecipientProfile = async (
  changes: ProtocolValuesRecord,
  activeDraft: ActiveDraftOverride,
): Promise<RecipientProfileSyncResult | null> => {
  const hasGeneratedTransfusionHistory = Boolean(
    changes.previousTransfusionsAutoText?.trim() ||
    activeDraft.values.previousTransfusionsAutoText?.trim(),
  );
  const profilePatch = Object.fromEntries(
    Object.entries(changes).filter(([key]) => {
      if (!recipientProfileFieldSet.has(key)) return false;
      if (
        hasGeneratedTransfusionHistory &&
        (key === 'previousTransfusionsStatus' || key === 'previousTransfusions')
      ) {
        return false;
      }
      return true;
    }),
  );

  if (Object.keys(profilePatch).length === 0) return null;

  const activeValues = activeDraft.values;
  const recipientId = getRecipientId(activeValues);
  const fullName = activeValues.recipientName?.trim();
  if (!recipientId || !fullName) return null;

  const storedRecipient = readCurrentRecipient();
  if (storedRecipient && storedRecipient.id !== recipientId) return null;

  const optimisticProfile = mergeProfileValues(
    storedRecipient?.profile ?? profileFromValues(activeValues),
    profilePatch,
  );
  writeCurrentRecipientSnapshot({
    id: recipientId,
    fullName,
    profile: optimisticProfile,
  });

  let [protocolDraft, registrationDraft] = await Promise.all([
    loadProtocolDraft(),
    loadRegistrationDraft(),
  ]);

  if (activeDraft.kind === 'protocol') {
    protocolDraft = {
      values: activeDraft.values,
      protocolRecordId: null,
      updatedAt: Date.now(),
    };
  } else {
    registrationDraft = {
      values: activeDraft.values,
      registrationRecordId: null,
      updatedAt: Date.now(),
    };
  }

  const recipient = await updateRecipient(recipientId, {
    ...profilePatch,
    recipientId: String(recipientId),
    recipientName: fullName,
  });

  const sharedValues: ProtocolValuesRecord = {
    ...recipientProfileValuesForForms(recipient),
    ...profilePatch,
  };

  const protocolRecipientId = getRecipientId(protocolDraft.values);
  const registrationRecipientId = getRecipientId(registrationDraft.values);

  if (protocolRecipientId !== null && protocolRecipientId !== recipient.id) {
    await savePreviousProtocol(protocolDraft, recipient.id);
    protocolDraft = {
      values: {
        ...reusableProtocolValues(protocolDraft.values),
        ...sharedValues,
      },
      protocolRecordId: null,
      updatedAt: Date.now(),
    };
  } else {
    const profileChanged = hasRecipientProfileDifference(protocolDraft.values, recipient);
    protocolDraft = {
      ...protocolDraft,
      values: {
        ...protocolDraft.values,
        ...sharedValues,
        ...generatedTransfusionHistoryValues(protocolDraft.values),
      },
      protocolRecordId:
        profileChanged && protocolDraft.protocolRecordId !== null
          ? null
          : protocolDraft.protocolRecordId,
      updatedAt: Date.now(),
    };
  }

  if (registrationRecipientId !== null && registrationRecipientId !== recipient.id) {
    await savePreviousRegistration(registrationDraft, recipient.id);
    registrationDraft = {
      values: {
        ...sharedValues,
      },
      registrationRecordId: null,
      updatedAt: Date.now(),
    };
  } else {
    const profileChanged = hasRecipientProfileDifference(registrationDraft.values, recipient);
    registrationDraft = {
      ...registrationDraft,
      values: { ...registrationDraft.values, ...sharedValues },
      registrationRecordId:
        profileChanged && registrationDraft.registrationRecordId !== null
          ? null
          : registrationDraft.registrationRecordId,
      updatedAt: Date.now(),
    };
  }

  await Promise.all([saveProtocolDraft(protocolDraft), saveRegistrationDraft(registrationDraft)]);

  writeCurrentRecipient(recipient);

  return {
    recipient,
    protocolValues: protocolDraft.values,
    registrationValues: registrationDraft.values,
  };
};

const switchRecipient = async (
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

  await savePreviousRequestDrafts(recipient.id);

  const protocolRecipientId = getRecipientId(protocolDraft.values);
  const registrationRecipientId = getRecipientId(registrationDraft.values);
  const activeRecipientId = storedRecipient?.id ?? protocolRecipientId ?? registrationRecipientId;
  const hasConflictingDraft =
    (protocolRecipientId !== null && protocolRecipientId !== recipient.id) ||
    (registrationRecipientId !== null && registrationRecipientId !== recipient.id);

  if (activeRecipientId === recipient.id && !hasConflictingDraft) {
    const profileValues = recipientProfileValuesForForms(recipient);
    const protocolProfileChanged = hasRecipientProfileDifference(protocolDraft.values, recipient);
    const registrationProfileChanged = hasRecipientProfileDifference(
      registrationDraft.values,
      recipient,
    );
    const protocolValues = {
      ...protocolDraft.values,
      ...profileValues,
      ...generatedTransfusionHistoryValues(protocolDraft.values),
    };
    const registrationValues = {
      ...registrationDraft.values,
      ...profileValues,
    };
    const now = Date.now();

    await Promise.all([
      saveProtocolDraft({
        values: protocolValues,
        protocolRecordId:
          protocolProfileChanged && protocolDraft.protocolRecordId !== null
            ? null
            : protocolDraft.protocolRecordId,
        updatedAt: now,
      }),
      saveRegistrationDraft({
        values: registrationValues,
        registrationRecordId:
          registrationProfileChanged && registrationDraft.registrationRecordId !== null
            ? null
            : registrationDraft.registrationRecordId,
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
      protocolRecordId:
        protocolProfileChanged && protocolDraft.protocolRecordId !== null
          ? null
          : protocolDraft.protocolRecordId,
      registrationRecordId:
        registrationProfileChanged && registrationDraft.registrationRecordId !== null
          ? null
          : registrationDraft.registrationRecordId,
    };
  }

  const [protocolSaved, registrationSaved] = await Promise.all([
    savePreviousProtocol(protocolDraft, recipient.id),
    savePreviousRegistration(registrationDraft, recipient.id),
  ]);

  const profileValues = recipientProfileValuesForForms(recipient);
  const protocolValues = {
    ...(protocolRecipientId !== null && protocolRecipientId !== recipient.id
      ? reusableProtocolValues(protocolDraft.values)
      : protocolDraft.values),
    ...profileValues,
  };
  const registrationValues = {
    ...(registrationRecipientId !== null && registrationRecipientId !== recipient.id
      ? {}
      : registrationDraft.values),
    ...profileValues,
  };
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

  if (storedRecipient?.id !== recipient.id) resetCurrentIndications(recipient.id);
  writeCurrentRecipient(recipient);

  return {
    changed: true,
    protocolSaved,
    registrationSaved,
    protocolValues,
    registrationValues,
    protocolRecordId: null,
    registrationRecordId: null,
  };
};

export const updateCurrentRecipientProfile = async (
  recipient: CurrentRecipient,
  changes: ProtocolValuesRecord,
): Promise<RecipientRecord> => {
  const storedRecipient = readCurrentRecipient();
  if (storedRecipient && storedRecipient.id !== recipient.id) {
    throw new Error('Текущий реципиент изменён. Повторите ввод данных.');
  }

  const optimisticProfile = mergeProfileValues(
    storedRecipient?.profile ?? recipient.profile,
    changes,
  );
  writeCurrentRecipientSnapshot({
    id: recipient.id,
    fullName: recipient.fullName,
    profile: optimisticProfile,
  });

  return runRecipientOperation(async () => {
    const activeRecipient = readCurrentRecipient();
    if (!activeRecipient || activeRecipient.id !== recipient.id) {
      throw new Error('Текущий реципиент изменён. Повторите ввод данных.');
    }
    const updatedRecipient = await updateRecipient(recipient.id, {
      ...changes,
      recipientId: String(recipient.id),
      recipientName: recipient.fullName,
    });
    await switchRecipient(updatedRecipient);
    return updatedRecipient;
  });
};

export const syncCurrentRecipientProfile = (
  changes: ProtocolValuesRecord,
  activeDraft: ActiveDraftOverride,
) => runRecipientOperation(() => syncRecipientProfile(changes, activeDraft));

export const switchCurrentRecipient = (
  recipient: RecipientRecord,
  activeDraft?: ActiveDraftOverride,
) => runRecipientOperation(() => switchRecipient(recipient, activeDraft));
