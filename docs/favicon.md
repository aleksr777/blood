# Иконка приложения

Бордовая капля крови с белой окантовкой на синем фоне со скруглёнными углами. Палитра соответствует `--ui-accent` (`#426b96`) и `--blood-red-selected` (`#a7495c`). Изображение создано встроенным генератором изображений; PNG и ICO получены уменьшением с сохранением прозрачности.

Файлы в `public/`:

- `favicon.ico`: 16, 32, 48, 64, 128 и 256 px для вкладок и закладок.
- `icons/blood-32.png`: небольшой значок вкладки.
- `icons/blood-192.png` и `icons/blood-512.png`: крупные значки закладок и манифеста.
- `apple-touch-icon.png`: 180 px для закладок Apple.
- `site.webmanifest`: описание и относительные пути значков.

Ссылки в `index.html` используют `%BASE_URL%`, чтобы значки загружались при публикации в `/blood/`. Печатные бланки не содержат иконку.

Запрос генерации:

> A production browser favicon for a transfusion protocol application: one large upright burgundy blood droplet (#a7495c) with a bold white outline, centered on a rounded-square slate-blue tile (#426b96). Restrained professional medical interface, simple strong silhouette recognizable at 16 and 32 pixels. Real transparency outside the rounded tile. No text, extra symbols or watermark.

Уточнение при генерации: сохранить композицию, сделать заливки ровнее и убрать артефакты внутри синего фона.
