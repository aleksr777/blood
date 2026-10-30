# Иконка приложения

За основу взято присланное изображение красного гемакона: сохранены подвес, волнистая граница жидкости, внутренний просвет, нижние порты и изогнутая трубка. Встроенный imagegen подготовил прозрачный мастер; его контур переведён в SVG без фоновой текстуры. Цвет знака — `#e60012`.

Общий исходник — `assets/branding/blood-mark.svg`. Все версии используют один контур, одинаковые пропорции и центрирование. Обычные значки имеют белый фон; версия для закреплённых вкладок Safari — чёрный контур на прозрачном фоне. В адаптивных значках весь рисунок помещён внутрь безопасной центральной окружности радиусом 40% стороны.

| Назначение | Файлы в `public/` | Размеры |
| --- | --- | --- |
| Вкладки, закладки, масштабирование | `favicon.svg`, `favicon.ico` | SVG; ICO: 16, 24, 32, 48, 64, 128, 256 px |
| PNG для браузеров и ярлыков | `icons/blood-*.png` | 16, 32, 48, 96, 192, 512 px |
| iPhone и iPad | `apple-touch-icon.png`, `icons/apple-touch-*.png` | 180, 120, 152, 167 px |
| Адаптивные ярлыки Android и других систем | `icons/blood-maskable-*.png` | 192, 512 px |
| Закреплённые вкладки Safari | `safari-pinned-tab.svg` | SVG, `viewBox="0 0 16 16"` |
| Плитки Windows | `icons/mstile-*.png`, `browserconfig.xml` | 70, 150, 310, 310×150 px |

`index.html` подключает иконки и метаданные для всех страниц приложения. В `href` и URL метаданных Windows указаны пути от корня, например `/favicon.ico`: Vite сам добавляет базовый путь `/blood/` в режиме разработки и при сборке. Дополнительный `%BASE_URL%` в этих адресах не нужен: в режиме разработки это удваивает префикс до `/blood/blood/`. В `site.webmanifest` пути относительны самому манифесту; значки `any` и `maskable` разделены. Параметр `v=4` меняет адреса ресурсов в браузерном кэше. Ранее созданные системные ярлыки могут потребовать пересоздания для обновления значка.

## Повторная генерация

Установите Inkscape и ImageMagick 6 или 7, затем выполните:

```bash
npm run icons
```

Скрипт `scripts/generate-icons.mjs` создаёт SVG, PNG и многослойный ICO из общего исходника. ICO явно собирается из семи проверенных PNG и заменяется атомарно после завершения записи. Эти инструменты нужны только при подготовке значков; сайт использует готовые файлы. SVG не содержит растровых вставок, шрифтов или внешних ресурсов.

```bash
npm run check:icons
```

Проверка читает все значки, на которые ссылаются HTML, манифест и настройки Windows: проверяет SVG, размеры PNG, полноту сжатых пикселей и ICO-контейнера. Она запускается перед `npm run dev`, после генерации значков и после сборки для файлов в `dist/`. Регрессионный тест отдельно проверяет фактические ссылки, возвращаемые HTML-преобразованием сервера Vite.

Справочные требования: [манифест и безопасная область](https://w3c.github.io/manifest/#icon-masks), [значки Apple](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html), [закреплённые вкладки Safari](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/pinnedTabs/pinnedTabs.html).

## Запрос для imagegen

> Prepare a clean square transparent-background master from the supplied red blood-bag image. Preserve the complete emblem and proportions: the outer bag, top hanger and circular opening, wavy liquid surface, inner gap, two lower ports, and the entire curved tube. Remove the paper background and texture. Keep a uniform rich red, smooth edges, the complete mark centered at approximately 92% of canvas height, without cropping or stretching. No added text, gradients, shadows, frames or watermark.
