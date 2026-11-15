export const resolveTextSelectionMode = (
  development: boolean,
  override?: string,
): 'enabled' | 'disabled' => {
  if (override === 'true') return 'enabled';
  if (override === 'false') return 'disabled';
  return development ? 'enabled' : 'disabled';
};
