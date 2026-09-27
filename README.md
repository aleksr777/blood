# Протокол трансфузии

Одностраничное React + Vite приложение с интерактивным бланком «Протокол трансфузии» по приложению № 11 к приказу Минздрава России от 28.10.2020 № 1170н.

## Запуск

```bash
npm install
npm run dev
```

## Проверка и сборка

```bash
npm run lint
npm run build
npm run preview
```

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
The SAH pool is intended for a single active database connection per origin, so opening the
application in multiple tabs at the same time is not supported yet.
