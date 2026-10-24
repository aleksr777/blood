import { expect, it } from 'vitest';
import { savedDocumentTitle } from './saved-document-title';

it.each([
  ['protocol', 'Протокол трансфузии'],
  ['registration', 'Лист регистрации трансфузий'],
  ['component-request', 'Заявка в трансфузиологический кабинет'],
  ['individual-selection-direction', 'Направление на индивидуальный подбор'],
] as const)(
  'names %s by its form group without IDs, components or missing-date placeholders',
  (kind, name) => {
    expect(
      savedDocumentTitle(kind, { id: 42, requiredComponent: 'Эритроциты', updatedAt: Date.now() }),
    ).toBe(name);
    expect(
      savedDocumentTitle(kind, { transfusionDate: '2020-10-21', directionDate: '2020-10-22' }),
    ).toBe(
      kind === 'registration' ? name : `${name} · ${kind === 'protocol' ? '21' : '22'}.10.2020`,
    );
  },
);
