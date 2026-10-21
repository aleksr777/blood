// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DatabaseRequest, DatabaseResponse } from './database-types';

let failInitialization = false;
const actions: string[] = [];

class TestWorker extends EventTarget {
  static instances: TestWorker[] = [];
  static delay = 0;
  static silent = false;
  terminated = false;

  constructor() {
    super();
    TestWorker.instances.push(this);
  }

  terminate() {
    this.terminated = true;
  }

  postMessage(message: DatabaseRequest) {
    actions.push(message.action);
    const failed = message.action === 'init' && failInitialization;
    const respond = () => {
      if (TestWorker.silent || this.terminated) return;
      const response: DatabaseResponse = {
        id: message.id,
        ok: !failed,
        result: message.action === 'init' ? true : [],
        error: failed ? 'База занята другой вкладкой' : undefined,
        errorCode: failed ? 'database-in-use' : undefined,
      };
      this.dispatchEvent(new MessageEvent('message', { data: response }));
    };
    if (TestWorker.delay) window.setTimeout(respond, TestWorker.delay);
    else queueMicrotask(respond);
  }
}

beforeEach(() => {
  vi.resetModules();
  actions.length = 0;
  failInitialization = false;
  TestWorker.instances.length = 0;
  TestWorker.delay = 0;
  TestWorker.silent = false;
  vi.stubGlobal('Worker', TestWorker);
  Object.defineProperty(navigator, 'storage', {
    configurable: true,
    value: { persist: vi.fn().mockResolvedValue(false) },
  });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

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
    await expect(database.searchRecipients('')).rejects.toMatchObject({
      message: 'База занята другой вкладкой',
      code: 'database-in-use',
    });
    expect(navigator.storage.persist).not.toHaveBeenCalled();
    expect(TestWorker.instances[0].terminated).toBe(true);
    failInitialization = false;
    await expect(database.searchRecipients('')).resolves.toEqual([]);
    expect(actions).toEqual(['init', 'init', 'recipients:search']);
    expect(TestWorker.instances).toHaveLength(2);
  });

  it('waits for a slow cold start beyond the old ten-second deadline', async () => {
    vi.useFakeTimers();
    TestWorker.delay = 12000;
    const { initializeDatabase } = await import('./database-client');
    const opened = initializeDatabase();
    const result = expect(opened).resolves.toBeUndefined();
    await vi.advanceTimersByTimeAsync(12000);
    await result;
    expect(TestWorker.instances[0].terminated).toBe(false);
  });

  it('terminates a hung startup and uses a fresh worker on retry', async () => {
    vi.useFakeTimers();
    TestWorker.silent = true;
    const { initializeDatabase } = await import('./database-client');
    const opened = initializeDatabase();
    const failure = expect(opened).rejects.toMatchObject({ code: 'database-startup-timeout' });
    await vi.advanceTimersByTimeAsync(60000);
    await failure;
    expect(TestWorker.instances[0].terminated).toBe(true);
    TestWorker.silent = false;
    await expect(initializeDatabase()).resolves.toBeUndefined();
    expect(TestWorker.instances).toHaveLength(2);
  });

  it('reports startup progress without treating it as a completed request', async () => {
    vi.useFakeTimers();
    TestWorker.silent = true;
    const { initializeDatabase } = await import('./database-client');
    const first = vi.fn();
    const second = vi.fn();
    const opened = initializeDatabase(first);
    const concurrent = initializeDatabase(second);
    const worker = TestWorker.instances[0];
    const data = { id: 1, ok: true, progress: 'storage' } satisfies DatabaseResponse;
    worker.dispatchEvent(new MessageEvent('message', { data }));
    expect(first).toHaveBeenLastCalledWith('storage');
    expect(second).toHaveBeenLastCalledWith('storage');
    expect(navigator.storage.persist).not.toHaveBeenCalled();
    const failure = expect(opened).rejects.toThrow('Открытие сохранённых данных');
    const otherFailure = expect(concurrent).rejects.toThrow('Открытие сохранённых данных');
    await vi.advanceTimersByTimeAsync(60000);
    await Promise.all([failure, otherFailure]);
  });

  it('recovers from a worker loading error instead of waiting on the failed worker', async () => {
    TestWorker.silent = true;
    const { initializeDatabase } = await import('./database-client');
    const opened = initializeDatabase();
    const failure = expect(opened).rejects.toThrow('Worker failed to load');
    TestWorker.instances[0].dispatchEvent(
      new ErrorEvent('error', { message: 'Worker failed to load' }),
    );
    await failure;
    expect(TestWorker.instances[0].terminated).toBe(true);
    TestWorker.silent = false;
    await expect(initializeDatabase()).resolves.toBeUndefined();
    expect(TestWorker.instances).toHaveLength(2);
  });

  it('does not hold startup while optional storage persistence permission is pending', async () => {
    vi.mocked(navigator.storage.persist).mockReturnValue(new Promise(() => undefined));
    const { database } = await import('./database-client');
    await expect(database.searchRecipients('')).resolves.toEqual([]);
    expect(actions).toEqual(['init', 'recipients:search']);
  });
});
