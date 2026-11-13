import { describe, expect, it } from 'vitest';
import { getDropdownViewportPlacement } from './use-overlay-dropdown';

describe('выпадающие списки с отступом от краёв окна', () => {
  const viewport = { top: 0, bottom: 600 };

  it('показывает меню снизу, если место достаточно', () => {
    expect(getDropdownViewportPlacement({ top: 100, bottom: 132 }, viewport, 192)).toEqual({
      placement: 'below',
      maxHeight: 451,
    });
  });

  it('переносит длинное меню вверх при недостатке места снизу', () => {
    expect(getDropdownViewportPlacement({ top: 500, bottom: 532 }, viewport, 192)).toEqual({
      placement: 'above',
      maxHeight: 483,
    });
  });

  it('ограничивает высоту и сохраняет место у нижнего края, если сверху ещё теснее', () => {
    expect(
      getDropdownViewportPlacement({ top: 12, bottom: 44 }, { top: 0, bottom: 140 }, 192),
    ).toEqual({
      placement: 'below',
      maxHeight: 79,
    });
  });

  it('учитывает сдвиг видимой области при использовании экранной клавиатуры', () => {
    expect(
      getDropdownViewportPlacement({ top: 380, bottom: 412 }, { top: 120, bottom: 460 }, 150),
    ).toEqual({
      placement: 'above',
      maxHeight: 243,
    });
  });
});
