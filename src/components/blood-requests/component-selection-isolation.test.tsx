// @vitest-environment jsdom
import {
  readProtocolDraft,
  requestKey,
  directionKey,
  nameLabel,
  codeLabel,
  readDraft,
  navigate,
  openProtocol,
  openRequest,
  openDirection,
  closeEditor,
  expectSelection,
  renderApp,
} from './component-selection.fixture';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { expect, it } from 'vitest';

it('keeps each page selection independent through edits, navigation and reload', async () => {
  let app = renderApp();
  openProtocol();
  await expectSelection('Эритроциты', 'Отмытые эритроциты');
  closeEditor();

  await navigate('Заявка в трансфузиологический кабинет', 'component-request');
  openRequest();
  await expectSelection('Эритроциты', 'ЭВ-Л. Эритроцитная взвесь лейкоредуцированная', true);
  fireEvent.click(screen.getByRole('button', { name: 'Плазма' }));
  fireEvent.change(screen.getByRole('textbox', { name: codeLabel }), {
    target: { value: 'СЗП. Плазма свежезамороженная' },
  });
  closeEditor();
  await waitFor(() => expect(readDraft(requestKey).componentCode).toBe('СЗП'));

  await navigate('Направление на индивидуальный подбор', 'summary-request');
  openDirection();
  await expectSelection('Эритроциты', 'Эритроцитная масса');
  fireEvent.click(screen.getByRole('button', { name: 'Тромбоциты' }));
  fireEvent.change(screen.getByRole('textbox', { name: nameLabel }), {
    target: { value: 'Тромбоциты для направления' },
  });
  closeEditor();
  await waitFor(() =>
    expect(readDraft(directionKey).requiredComponent).toBe('Тромбоциты для направления'),
  );

  await navigate('Протокол трансфузии', 'protocol');
  openProtocol();
  await expectSelection('Эритроциты', 'Отмытые эритроциты');
  fireEvent.click(screen.getByRole('button', { name: 'Гранулоциты' }));
  fireEvent.change(screen.getByRole('textbox', { name: nameLabel }), {
    target: { value: 'Гранулоциты для протокола' },
  });
  closeEditor();
  await waitFor(() =>
    expect(readProtocolDraft().values.componentName).toBe('Гранулоциты для протокола'),
  );

  for (const [page, link, open, group, name, coded] of [
    [
      'component-request',
      'Заявка в трансфузиологический кабинет',
      openRequest,
      'Плазма',
      'СЗП. Плазма свежезамороженная',
      true,
    ],
    [
      'summary-request',
      'Направление на индивидуальный подбор',
      openDirection,
      'Тромбоциты',
      'Тромбоциты для направления',
      false,
    ],
    [
      'protocol',
      'Протокол трансфузии',
      openProtocol,
      'Гранулоциты',
      'Гранулоциты для протокола',
      false,
    ],
  ] as const) {
    await navigate(link, page);
    open();
    await expectSelection(group, name, coded);
    closeEditor();
    app.unmount();
    app = renderApp();
    open();
    await expectSelection(group, name, coded);
    closeEditor();
  }
  expect(readDraft(requestKey).componentCode).toBe('СЗП');
}, 15000);
