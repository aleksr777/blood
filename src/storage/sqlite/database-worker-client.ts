import { DatabaseError } from './database-errors';
import {
  databaseStartupMessages,
  type DatabaseStartupReporter,
  type DatabaseStartupStage,
} from './database-startup';
import type { DatabaseAction, DatabaseRequest, DatabaseResponse } from './database-types';

const STARTUP_TIMEOUT_MS = 60000;
const REQUEST_TIMEOUT_MS = 10000;

type PendingRequest = {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
  timeoutId: number;
  onProgress?: DatabaseStartupReporter;
};

let worker: Worker | null = null;
let nextRequestId = 1;
const pending = new Map<number, PendingRequest>();

const stopWorker = (source: Worker, error: Error) => {
  if (worker !== source) return;
  worker = null;
  source.terminate();
  pending.forEach(({ reject, timeoutId }) => {
    window.clearTimeout(timeoutId);
    reject(error);
  });
  pending.clear();
};

const getWorker = () => {
  if (worker) return worker;
  const source = new Worker(new URL('./database.worker.ts', import.meta.url), { type: 'module' });
  worker = source;
  source.addEventListener('error', (event) => {
    stopWorker(
      source,
      new Error(event.message || 'Не удалось загрузить модуль локальной базы данных.'),
    );
  });
  source.addEventListener('message', (event: MessageEvent<DatabaseResponse>) => {
    if (worker !== source) return;
    const request = pending.get(event.data.id);
    if (!request) return;
    if (event.data.progress) {
      request.onProgress?.(event.data.progress);
      return;
    }
    pending.delete(event.data.id);
    window.clearTimeout(request.timeoutId);
    if (event.data.ok) request.resolve(event.data.result);
    else
      request.reject(new DatabaseError(event.data.error ?? 'Ошибка SQLite.', event.data.errorCode));
  });
  return source;
};

export const restartDatabaseWorker = () => {
  if (worker) stopWorker(worker, new Error('Запуск локальной базы данных прерван.'));
};

export const requestDatabase = <T>(
  action: DatabaseAction,
  payload?: unknown,
  onProgress?: DatabaseStartupReporter,
) =>
  new Promise<T>((resolve, reject) => {
    let source: Worker;
    try {
      source = getWorker();
    } catch (error) {
      reject(error);
      return;
    }
    const id = nextRequestId++;
    let stage: DatabaseStartupStage = 'worker';
    const timeoutId = window.setTimeout(
      () => {
        if (!pending.has(id)) return;
        if (action === 'init') {
          stopWorker(
            source,
            new DatabaseError(
              'Не удалось завершить запуск за 60 секунд. ' +
                `Этап: «${databaseStartupMessages[stage]}». ` +
                'Проверьте соединение с интернетом и нажмите «Повторить».',
              'database-startup-timeout',
            ),
          );
        } else {
          pending.delete(id);
          reject(
            new Error(
              'Операция с локальной базой данных не завершилась вовремя. Обновите страницу и повторите действие.',
            ),
          );
        }
      },
      action === 'init' ? STARTUP_TIMEOUT_MS : REQUEST_TIMEOUT_MS,
    );
    pending.set(id, {
      resolve: (value) => resolve(value as T),
      reject,
      timeoutId,
      onProgress: (nextStage) => {
        stage = nextStage;
        onProgress?.(nextStage);
      },
    });
    try {
      const message: DatabaseRequest = { id, action, payload };
      source.postMessage(message);
    } catch (error) {
      stopWorker(source, error instanceof Error ? error : new Error(String(error)));
    }
  });
