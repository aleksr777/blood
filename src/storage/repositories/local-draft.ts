export const persistLocalDraft = (key: string, draft: object) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(draft));
    return true;
  } catch (error) {
    console.error('Не удалось сохранить текущий бланк:', error);
    return false;
  }
};
