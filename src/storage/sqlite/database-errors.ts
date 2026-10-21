export type DatabaseErrorCode = 'database-in-use' | 'database-startup-timeout';

export class DatabaseError extends Error {
  constructor(
    message: string,
    readonly code?: DatabaseErrorCode,
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}
