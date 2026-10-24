// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { database } from '../sqlite/database-client';
import { WORKSPACE_ACTIVITY_KEY, WORKSPACE_INACTIVITY_MS } from '../workspace-activity';
import { prepareWorkspaceSession } from './workspace-session';

vi.mock('../sqlite/database-client', () => ({
  database: { resetWorkingDrafts: vi.fn(async () => undefined) },
}));

const now = new Date('2026-10-24T10:00:00Z').getTime();
const pendingKey = 'blood:workspace-reset-pending';
const workingKeys = [
  'blood:current-recipient',
  'blood:current-indications',
  'blood:component-request-direction-draft',
  'blood:component-request-direction-draft:saved-record-id',
  'blood:individual-selection-direction-draft',
  'blood:individual-selection-direction-draft:saved-record-id',
];
const sessionKeys = [
  'blood:protocol-open-window',
  'blood:protocol-open-record',
  'blood:registration-open-record',
  'blood:component-request-open-record',
  'blood:individual-selection-direction-open-record',
];

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
  vi.mocked(database.resetWorkingDrafts).mockReset().mockResolvedValue(undefined);
  localStorage.clear();
  sessionStorage.clear();
  workingKeys.forEach((key) => localStorage.setItem(key, 'draft'));
  sessionKeys.forEach((key) => sessionStorage.setItem(key, 'pending'));
  localStorage.setItem('blood:reagent-defaults', '{"reagentAntiASeries":"123"}');
  localStorage.setItem('unrelated', 'keep');
});
afterEach(() => vi.useRealTimers());

describe('workspace inactivity reset', () => {
  it.each([null, String(now - WORKSPACE_INACTIVITY_MS), 'invalid', String(now + 1000)])(
    'keeps the workspace without evidence of more than 24 hours inactivity: %s',
    async (stored) => {
      if (stored !== null) localStorage.setItem(WORKSPACE_ACTIVITY_KEY, stored);
      await prepareWorkspaceSession();
      expect(database.resetWorkingDrafts).not.toHaveBeenCalled();
      workingKeys.forEach((key) => expect(localStorage.getItem(key)).toBe('draft'));
      expect(localStorage.getItem(WORKSPACE_ACTIVITY_KEY)).toBe(String(now));
    },
  );

  it('clears every working form and pending window, preserving reagents and unrelated storage', async () => {
    localStorage.setItem(WORKSPACE_ACTIVITY_KEY, String(now - WORKSPACE_INACTIVITY_MS - 1));
    await Promise.all([prepareWorkspaceSession(), prepareWorkspaceSession()]);
    expect(database.resetWorkingDrafts).toHaveBeenCalledTimes(1);
    workingKeys.forEach((key) => expect(localStorage.getItem(key)).toBeNull());
    sessionKeys.forEach((key) => expect(sessionStorage.getItem(key)).toBeNull());
    expect(localStorage.getItem('blood:reagent-defaults')).toBe('{"reagentAntiASeries":"123"}');
    expect(localStorage.getItem('unrelated')).toBe('keep');
    expect(localStorage.getItem(pendingKey)).toBeNull();
    expect(localStorage.getItem(WORKSPACE_ACTIVITY_KEY)).toBe(String(now));
  });

  it('retries an interrupted reset without renewing the expired timestamp on failure', async () => {
    const expired = String(now - WORKSPACE_INACTIVITY_MS - 1);
    localStorage.setItem(WORKSPACE_ACTIVITY_KEY, expired);
    vi.mocked(database.resetWorkingDrafts).mockRejectedValueOnce(new Error('Write failed'));
    await expect(prepareWorkspaceSession()).rejects.toThrow('Write failed');
    expect(localStorage.getItem(WORKSPACE_ACTIVITY_KEY)).toBe(expired);
    expect(localStorage.getItem(pendingKey)).toBe('1');
    // Even a clock correction cannot skip a partly completed reset after reload.
    localStorage.setItem(WORKSPACE_ACTIVITY_KEY, String(now));
    await prepareWorkspaceSession();
    workingKeys.forEach((key) => expect(localStorage.getItem(key)).toBeNull());
    expect(database.resetWorkingDrafts).toHaveBeenCalledTimes(2);
    expect(localStorage.getItem(pendingKey)).toBeNull();
  });
});
