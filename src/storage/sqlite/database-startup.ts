export const databaseStartupMessages = {
  worker: 'Загрузка файлов локальной базы данных',
  ownership: 'Проверка доступа к базе данных',
  sqlite: 'Запуск модуля базы данных',
  storage: 'Открытие сохранённых данных',
  schema: 'Проверка структуры базы данных',
  migration: 'Перенос сохранённых отделений',
};

export type DatabaseStartupStage = keyof typeof databaseStartupMessages;
export type DatabaseStartupReporter = (stage: DatabaseStartupStage) => void;
