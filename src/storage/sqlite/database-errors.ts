export type DatabaseErrorCode = 'database-in-use' | 'database-startup-timeout' | 'unsupported-opfs';

export class DatabaseError extends Error {
  constructor(
    message: string,
    readonly code?: DatabaseErrorCode,
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export const describeDatabaseError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes('The local OPFS API is too old for opfs-sahpool')) {
    return new DatabaseError(
      'Этот браузер использует устаревший API локального хранилища OPFS. ' +
        'Обновите браузер и откройте приложение снова. ' +
        'Не очищайте данные сайта: в них могут храниться сохранённые документы.',
      'unsupported-opfs',
    );
  }

  if (
    message.includes('createSyncAccessHandle') ||
    message.includes('another open Access Handle') ||
    message.includes('Writable stream associated with the same file')
  ) {
    return new DatabaseError(
      'Локальная база данных занята другой вкладкой или старой версией приложения. ' +
        'Закройте все вкладки с приложением, откройте его снова и повторите действие.',
      'database-in-use',
    );
  }

  return error instanceof Error ? error : new Error(message);
};
