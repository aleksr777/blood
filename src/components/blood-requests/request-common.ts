import type { KeyboardEvent } from 'react';

export const REQUEST_AUTO_FIELDS = [
  'recipientAboRh',
  'recipientPhenotype',
  'recipientName',
  'recipientAge',
  'department',
  'medicalRecordNumber',
  'diagnosis',
  'obstetricHistory',
  'recipientSex',
] as const;

export type RequestAutoField = (typeof REQUEST_AUTO_FIELDS)[number];

export const readSavedRequestRecordId = (storageKey: string) => {
  try {
    const raw = window.localStorage.getItem(`${storageKey}:saved-record-id`);
    if (!raw) return null;
    const id = Number(raw);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
};

export const activateOnKeyboard = (event: KeyboardEvent<HTMLElement>, action: () => void) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    action();
  }
};

export const formatDirectionDate = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}.${match[2]}.${match[1]}` : '';
};
