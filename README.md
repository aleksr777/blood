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

Persistent shared application data is stored in SQLite WASM using OPFS. The database runs
inside a Web Worker and does not require a backend.

The hosting environment must return these headers:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

Vite development and preview servers are configured automatically. GitHub Pages does not
support the required response headers, so OPFS-backed SQLite must be deployed to a static
host that allows custom headers.
