# Бланки трансфузиологии

React + Vite приложение для заполнения, сохранения и печати протокола трансфузии,
листа регистрации трансфузий, направления на индивидуальный подбор и заявки
в трансфузиологический кабинет.

## Запуск

Для разработки необходим Node.js 22.12+ (ветка 22), 24 или 26+.

```bash
npm ci
npm run dev
```

## Проверка и сборка

```bash
npm run check
npm run preview
```

`check` запускает ESLint, регрессионные тесты, проверку TypeScript и production-сборку.
Тесты хранилища используют настоящий SQLite WASM с временной базой в памяти.
Проверки автоматически выполняются для ветки `develop` и pull request в `develop`/`main`.

Данные текущего реципиента общие для всех текущих бланков. При смене реципиента
заполненные несохранённые бланки сохраняются для предыдущего реципиента.
Изменение карточки реципиента само по себе не переписывает архив. При сохранении
протокола запись с тем же номером гемакона у этого реципиента обновляется;
другой номер создаёт новую запись. Пробелы в номере не влияют на поиск совпадения.
Листы регистрации и заявки сохраняются отдельными записями.

Сохранение и печать протокола доступны после заполнения наименования компонента,
номера гемакона из 14 цифр и группы крови AB0 гемакона. Объём и срок годности
не обязательны для разблокировки кнопок. Предупреждение в панели появляется
при нажатии на сохранение или печать, в том числе на заблокированные кнопки.
Незавершённые данные остаются в текущем черновике. При печати через меню браузера
вместо незаполненного протокола выводится предупреждение.

## Печать

Нажмите **«Печать A4»**. В диалоге браузера рекомендуется использовать:

- бумагу A4;
- масштаб 100%;
- книжную ориентацию;
- отключенные колонтитулы браузера.

Печатная форма разделена на две страницы A4. При печати панель управления и служебная подсказка скрываются.

## Client database

Persistent shared application data is stored locally in SQLite WASM using the OPFS
SyncAccessHandle Pool VFS (`opfs-sahpool`). SQLite runs inside a Web Worker and does not
require a backend or COOP/COEP response headers.

The storage is persistent between sessions for the same site origin and browser profile.
The SAH pool allows one active database connection per origin. Before mounting any forms,
the application checks database ownership. Additional tabs show a blocking dialog without
modifying drafts. This warning contains no buttons and cannot be dismissed; it remains
visible until the duplicate tab is closed.

Startup allows up to 60 seconds for downloading and opening SQLite and displays its current
stage. A failed startup stops its worker; retrying creates a fresh worker and reopens the
same storage. The optional persistent-storage permission request does not delay startup.
