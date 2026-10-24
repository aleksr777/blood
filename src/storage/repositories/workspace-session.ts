import { database } from '../sqlite/database-client';
import {
  isWorkspaceInactive,
  readWorkspaceActivity,
  writeWorkspaceActivity,
} from '../workspace-activity';
import { runRecipientOperation } from './recipient-operation-queue';
import { REQUEST_DRAFTS } from './request-drafts';

const RESET_PENDING_KEY = 'blood:workspace-reset-pending';
const workingKeys = [
  'blood:current-recipient',
  'blood:current-indications',
  ...REQUEST_DRAFTS.flatMap(({ storageKey }) => [storageKey, `${storageKey}:saved-record-id`]),
];
const pendingDocumentKeys = [
  'blood:protocol-open-window',
  ...['protocol', 'registration', ...REQUEST_DRAFTS.map(({ kind }) => kind)].map(
    (kind) => `blood:${kind}-open-record`,
  ),
];

let preparation: Promise<void> | null = null;

export const prepareWorkspaceSession = () => {
  // StrictMode and retries share one operation; recipient changes finish before the reset.
  preparation ??= runRecipientOperation(async () => {
    if (
      window.localStorage.getItem(RESET_PENDING_KEY) ||
      isWorkspaceInactive(readWorkspaceActivity())
    ) {
      // Keep this marker until every storage has been cleared, including across reloads.
      window.localStorage.setItem(RESET_PENDING_KEY, '1');
      await database.resetWorkingDrafts();
      workingKeys.forEach((key) => window.localStorage.removeItem(key));
      pendingDocumentKeys.forEach((key) => window.sessionStorage.removeItem(key));
    }
    writeWorkspaceActivity(Date.now());
    window.localStorage.removeItem(RESET_PENDING_KEY);
  }).finally(() => {
    preparation = null;
  });
  return preparation;
};
