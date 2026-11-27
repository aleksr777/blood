let requestQueue: Promise<void> = Promise.resolve();

export const queueDatabaseRequest = <T>(callback: () => Promise<T>) => {
  const run = requestQueue.then(callback, callback);
  requestQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
};
