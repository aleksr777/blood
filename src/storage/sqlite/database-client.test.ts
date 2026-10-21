// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DatabaseRequest, DatabaseResponse } from './database-types';

let failInitialization = false;
const actions: string[] = [];

class TestWorker extends EventTarget {
  postMessage(message: DatabaseRequest) {
    actions.push(message.action);
    const failed = message.action === 'init' && failInitialization;
    queueMicrotask(() => {
      const response: DatabaseResponse = {
        id: message.id,
        ok: !failed,
        result: message.action === 'init' ? true : [],
        error: failed ? 'База занята другой вкладкой' : undefined,
      };
      this.dispatchEvent(new MessageEvent('message', { data: response }));
    });
  }
}

beforeEach(() => {
  vi.resetModules();
  actions.length = 0;
  failInitialization = false;
  vi.stubGlobal('Worker', TestWorker);
  Object.defineProperty(navigator, 'storage', {
    configurable: true,
    value: { persist: vi.fn().mockResolvedValue(false) },
  });
});
afterEach(() => vi.unstubAllGlobals());

describe('database initialization', () => {
  it('opens SQLite even if the optional persistence permission request fails', async () => {
    vi.mocked(navigator.storage.persist).mockRejectedValue(new Error('Permission denied'));
    const { database } = await import('./database-client');
    await expect(database.searchRecipients('')).resolves.toEqual([]);
    expect(actions).toEqual(['init', 'recipients:search']);
  });

  it('allows a retry after the other tab is closed', async () => {
    const { database } = await import('./database-client');
    failInitialization = true;
    await expect(database.searchRecipients('')).rejects.toThrow('База занята');
    failInitialization = false;
    await expect(database.searchRecipients('')).resolves.toEqual([]);
    expect(actions).toEqual(['init', 'init', 'recipients:search']);
  });
});
