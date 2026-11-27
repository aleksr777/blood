const STORE_NAME = 'snapshots';
const DATABASE_NAME = 'blood-legacy-sqlite';
const SNAPSHOT_KEY = 'blood.sqlite3';
const PROBE_FILE = 'blood-opfs-compatibility-probe';

const openStorage = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Локальное хранилище занято другой вкладкой.'));
    request.onsuccess = () => {
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
  });

export const loadLegacySnapshot = async () => {
  const storage = await openStorage();
  try {
    return await new Promise<Uint8Array | undefined>((resolve, reject) => {
      const transaction = storage.transaction(STORE_NAME, 'readonly');
      const request = transaction.objectStore(STORE_NAME).get(SNAPSHOT_KEY);
      transaction.oncomplete = () => resolve(request.result as Uint8Array | undefined);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    storage.close();
  }
};

export const saveLegacySnapshot = async (snapshot: Uint8Array) => {
  const storage = await openStorage();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = storage.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).put(snapshot, SNAPSHOT_KEY);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    storage.close();
  }
};

// Probe outside the SAH pool. Its initialization may otherwise alter an existing
// pool when the browser still implements the older asynchronous OPFS methods.
export const supportsSynchronousOpfs = async () => {
  if (!navigator.storage?.getDirectory) return false;

  const root = await navigator.storage.getDirectory();
  const file = (await root.getFileHandle(PROBE_FILE, { create: true })) as FileSystemFileHandle & {
    createSyncAccessHandle?: () => Promise<{
      getSize: () => number | Promise<number>;
      close: () => void | Promise<void>;
    }>;
  };
  try {
    if (!file.createSyncAccessHandle) return false;
    const handle = await file.createSyncAccessHandle();
    let size: number | Promise<number>;
    let closed: void | Promise<void>;
    try {
      size = handle.getSize();
      await size;
    } finally {
      closed = handle.close();
      await closed;
    }
    return !(size instanceof Promise) && !(closed instanceof Promise);
  } finally {
    await root.removeEntry(PROBE_FILE);
  }
};
