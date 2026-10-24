# Иконка приложения

Иконка подготовлена из присланного пользователем изображения `1967.jpg`: две красные фигуры образуют сердце с каплей в центре. Изображение адаптировано встроенным редактором изображений под квадратный формат с белым фоном и уменьшенными внешними полями. PNG и ICO получены уменьшением подготовленного изображения.

Файлы в `public/`:

- `favicon.ico`: 16, 32, 48, 64, 128 и 256 px для вкладок и закладок.
- `icons/blood-32.png`: небольшой значок вкладки.
- `icons/blood-192.png` и `icons/blood-512.png`: крупные значки закладок и манифеста.
- `apple-touch-icon.png`: 180 px для закладок Apple.
- `site.webmanifest`: описание и относительные пути значков.

Ссылки в `index.html` используют `%BASE_URL%`, чтобы значки загружались при публикации в `/blood/`. Параметр `v=2` у иконок и манифеста обновляет адреса ресурсов в браузерном кэше. Печатные бланки не содержат иконку.

Запрос обработки исходного изображения:

> Prepare a square browser icon from the supplied 1967.jpg. Preserve the provided red emblem: two separate oval heads, the taller left figure, the smaller right figure, their intertwined heart-shaped bodies and the white teardrop-shaped gap. Remove excess outer whitespace, center the complete emblem on a pure white square canvas, enlarge it to about 92% of the height, and clean JPEG blur into smooth edges. Keep the original red color and the whole symbol visible without clipping or stretching. No text, additional symbols, border, shadow or watermark.
