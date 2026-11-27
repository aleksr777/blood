import { expect, it } from 'vitest';
import { DatabaseError, describeDatabaseError } from './database-errors';

it('explains unsupported asynchronous OPFS without misdiagnosing a locked database', () => {
  const error = describeDatabaseError(
    new Error(
      'The local OPFS API is too old for opfs-sahpool: ' +
        'it has an async FileSystemSyncAccessHandle.close() method.',
    ),
  );

  expect(error).toBeInstanceOf(DatabaseError);
  expect((error as DatabaseError).code).toBe('unsupported-opfs');
  expect(error.message).toContain('Обновите браузер');
  expect(error.message).toContain('Не очищайте данные сайта');
});
