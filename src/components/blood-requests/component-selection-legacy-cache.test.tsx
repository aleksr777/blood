// @vitest-environment jsdom
import {
  navigate,
  openProtocol,
  openRequest,
  openDirection,
  closeEditor,
  expectSelection,
  renderApp,
} from './component-selection.fixture';
import { screen } from '@testing-library/react';
import { expect, it } from 'vitest';

it('does not restore another document selection from a legacy shared indication cache', async () => {
  window.localStorage.setItem(
    'blood:current-indications',
    JSON.stringify({
      recipientId: 1,
      byComponent: {
        erythrocytes: {
          componentGroup: 'platelets',
          indicationComponent: 'platelets',
          componentName: 'Чужой компонент',
          requiredComponent: 'Чужой компонент',
          componentCode: 'ЧУЖОЙ',
          indicationRbcHemicHypoxia: '1',
        },
      },
    }),
  );
  renderApp();
  openProtocol();
  await expectSelection('Эритроциты', 'Отмытые эритроциты');
  expect(
    (screen.getByRole('checkbox', { name: 'Признаки гемической гипоксии' }) as HTMLInputElement)
      .checked,
  ).toBe(false);
  closeEditor();
  await navigate('Заявка в трансфузиологический кабинет', 'component-request');
  openRequest();
  await expectSelection('Эритроциты', 'ЭВ-Л. Эритроцитная взвесь лейкоредуцированная', true);
  closeEditor();
  await navigate('Направление на индивидуальный подбор', 'summary-request');
  openDirection();
  await expectSelection('Эритроциты', 'Эритроцитная масса');
});
