// @vitest-environment jsdom
import {
  readProtocolDraft,
  requestKey,
  directionKey,
  readDraft,
  navigate,
  openProtocol,
  openRequest,
  openDirection,
  closeEditor,
  expectSelection,
  renderApp,
} from './component-selection.fixture';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { expect, it } from 'vitest';

it('keeps indications and hemacon data within their own page after navigation', async () => {
  const app = renderApp();
  openProtocol();
  await expectSelection('Эритроциты', 'Отмытые эритроциты');
  fireEvent.click(screen.getByRole('checkbox', { name: 'Признаки гемической гипоксии' }));
  fireEvent.change(screen.getByRole('textbox', { name: '№ единицы компонента крови' }), {
    target: { value: '76102200045636' },
  });
  closeEditor();
  await waitFor(() => expect(readProtocolDraft().values.indicationRbcHemicHypoxia).toBe('1'));
  expect(readProtocolDraft().values.componentUnitNumber).toBe('761022 000456 36');

  await navigate('Заявка в трансфузиологический кабинет', 'component-request');
  openRequest();
  const request = within(screen.getByRole('dialog'));
  const indication = request.getByLabelText(
    'Код показания к трансфузии (графа 8)',
  ) as HTMLSelectElement;
  const code = [...indication.options].find((option) => option.value)?.value;
  expect(code).toBeTruthy();
  fireEvent.change(indication, { target: { value: code } });
  closeEditor();
  await waitFor(() => expect(readDraft(requestKey).transfusionIndicationCode).toBe(code));
  expect(readDraft(requestKey).indicationValues.indicationRbcHemicHypoxia).toBeUndefined();
  expect(readDraft(requestKey).componentUnitNumber).toBeUndefined();

  await navigate('Направление на индивидуальный подбор', 'summary-request');
  openDirection();
  const direction = within(screen.getByRole('dialog'));
  expect(
    (direction.getByRole('checkbox', { name: 'Признаки гемической гипоксии' }) as HTMLInputElement)
      .checked,
  ).toBe(false);
  fireEvent.click(direction.getByRole('checkbox', { name: 'Признаки гемической гипоксии' }));
  fireEvent.change(
    direction.getByRole('textbox', { name: 'Показания для индивидуального подбора' }),
    {
      target: { value: 'Аллоиммунные антитела к эритроцитам' },
    },
  );
  closeEditor();
  await waitFor(() =>
    expect(readDraft(directionKey).individualSelectionIndications).toBe(
      'Аллоиммунные антитела к эритроцитам',
    ),
  );
  expect(readDraft(directionKey).indicationValues.indicationRbcHemicHypoxia).toBe('1');
  expect(readDraft(requestKey).transfusionIndicationCode).toBe(code);
  expect(readDraft(requestKey).individualSelectionIndications).toBe('');
  expect(readProtocolDraft().values.indicationRbcHemicHypoxia).toBe('1');
  expect(readProtocolDraft().values.componentUnitNumber).toBe('761022 000456 36');
  app.unmount();

  renderApp();
  openDirection();
  const restoredDirection = within(screen.getByRole('dialog'));
  expect(
    (
      restoredDirection.getByRole('checkbox', {
        name: 'Признаки гемической гипоксии',
      }) as HTMLInputElement
    ).checked,
  ).toBe(true);
  expect(
    (
      restoredDirection.getByRole('textbox', {
        name: 'Показания для индивидуального подбора',
      }) as HTMLInputElement
    ).value,
  ).toBe('Аллоиммунные антитела к эритроцитам');
  closeEditor();
  await navigate('Заявка в трансфузиологический кабинет', 'component-request');
  openRequest();
  expect(
    (
      within(screen.getByRole('dialog')).getByLabelText(
        'Код показания к трансфузии (графа 8)',
      ) as HTMLSelectElement
    ).value,
  ).toBe(code);
  closeEditor();
  await navigate('Протокол трансфузии', 'protocol');
  openProtocol();
  await expectSelection('Эритроциты', 'Отмытые эритроциты');
  expect(
    (screen.getByRole('checkbox', { name: 'Признаки гемической гипоксии' }) as HTMLInputElement)
      .checked,
  ).toBe(true);
  expect(
    (screen.getByRole('textbox', { name: '№ единицы компонента крови' }) as HTMLInputElement).value,
  ).toBe('761022 000456 36');
}, 15000);
