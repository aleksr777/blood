let queue: Promise<void> = Promise.resolve();

export const runRecipientOperation = <T>(operation: () => Promise<T>) => {
  const result = queue.then(operation, operation);
  queue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
};
