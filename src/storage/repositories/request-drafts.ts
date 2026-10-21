import { saveBloodRequestRecord } from './recipients';

export const REQUEST_DRAFTS = [
  { storageKey: 'blood:component-request-direction-draft', kind: 'component-request' },
  {
    storageKey: 'blood:individual-selection-direction-draft',
    kind: 'individual-selection-direction',
  },
] as const;

const hasDocumentData = (draft: Record<string, unknown>) =>
  [
    'requiredComponent',
    'quantity',
    'componentAbo',
    'componentRh',
    'transfusionOrder',
    'componentSelectionRequirement',
    'individualSelectionIndications',
  ].some((field) => typeof draft[field] === 'string' && draft[field].trim() !== '');

export const savePreviousRequestDrafts = async (nextRecipientId: number) => {
  for (const { storageKey, kind } of REQUEST_DRAFTS) {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      continue;
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) continue;
    const draft = parsed as Record<string, unknown>;
    const recipientId = Number(draft.sourceRecipientId);
    if (!Number.isSafeInteger(recipientId) || recipientId <= 0 || recipientId === nextRecipientId)
      continue;

    const savedRecordId = Number(window.localStorage.getItem(`${storageKey}:saved-record-id`));
    if ((!Number.isSafeInteger(savedRecordId) || savedRecordId <= 0) && hasDocumentData(draft)) {
      await saveBloodRequestRecord({ recipientId, kind, values: draft });
    }

    // A new recipient gets a new request. Keep only reusable organization/staff fields.
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        medicalOrganization: draft.medicalOrganization ?? '',
        doctorName: draft.doctorName ?? '',
        doctorPhone: draft.doctorPhone ?? '',
      }),
    );
    window.localStorage.removeItem(`${storageKey}:saved-record-id`);
  }
};
