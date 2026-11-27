import { afterEach, expect, it, vi } from 'vitest';
import { supportsSynchronousOpfs } from './legacy-browser-storage';

afterEach(() => vi.unstubAllGlobals());

it.each([false, true])('detects asynchronous OPFS close: %s', async (olderBrowser) => {
  const removeEntry = vi.fn(async () => undefined);
  const close = vi.fn(() => (olderBrowser ? Promise.resolve() : undefined));
  vi.stubGlobal('navigator', {
    storage: {
      getDirectory: async () => ({
        getFileHandle: async () => ({
          createSyncAccessHandle: async () => ({ getSize: () => 0, close }),
        }),
        removeEntry,
      }),
    },
  });

  expect(await supportsSynchronousOpfs()).toBe(!olderBrowser);
  expect(close).toHaveBeenCalledOnce();
  expect(removeEntry).toHaveBeenCalledWith('blood-opfs-compatibility-probe');
});

it('rejects a browser without synchronous access handles', async () => {
  const removeEntry = vi.fn(async () => undefined);
  vi.stubGlobal('navigator', {
    storage: {
      getDirectory: async () => ({ getFileHandle: async () => ({}), removeEntry }),
    },
  });

  expect(await supportsSynchronousOpfs()).toBe(false);
  expect(removeEntry).toHaveBeenCalledOnce();
});
