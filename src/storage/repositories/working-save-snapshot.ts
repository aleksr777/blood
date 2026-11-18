import { getFormContentKey } from '../../domain/form-content';

export const matchesWorkingSave = (
  key: string,
  recipientId: number,
  values: Record<string, unknown>,
) => {
  try {
    const raw = window.sessionStorage.getItem(key);
    const saved = raw ? JSON.parse(raw) : null;
    return (
      saved?.record?.recipientId === recipientId &&
      saved.values &&
      getFormContentKey(saved.values) === getFormContentKey(values)
    );
  } catch {
    return false;
  }
};

export const clearWorkingSaveSnapshots = () => {
  try {
    for (const key of [
      'blood:protocol-working-save',
      'blood:registration-working-save',
      'blood:component-request-working-save',
      'blood:individual-direction-working-save',
    ])
      window.sessionStorage.removeItem(key);
  } catch {
    // Ignore unavailable session storage.
  }
};
