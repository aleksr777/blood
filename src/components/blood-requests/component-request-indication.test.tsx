// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { ComponentRequestForm } from './component-request-form';
import { request } from './component-request-form.fixture';

afterEach(cleanup);

const indicationCell = () =>
  screen.getByRole('table', { name: 'Графы 1–12 заявки' }).querySelector('tbody td:nth-child(8)');

it.each([
  ['1.1', 'Анемия в стационаре, Hb < 80 г/л'],
  ['4.3', 'Активность факторов свертывания ≤ 50%, нет концентрата фактора'],
  ['6', 'Нейтрофилы < 0,5 × 10⁹/л'],
])('показывает расшифровку кода %s отдельной строкой в графе 8', (code, description) => {
  render(
    <ComponentRequestForm
      values={{ ...request, transfusionIndicationCode: code }}
      examination={{}}
      readOnly
      onEdit={() => {}}
    />,
  );
  const cell = indicationCell();
  expect(cell?.firstElementChild?.textContent).toBe(code);
  expect(cell?.children[1]?.textContent).toBe(description);
});

it.each(['', '999'])('не показывает расшифровку для незаданного кода %s', (code) => {
  render(
    <ComponentRequestForm
      values={{ ...request, transfusionIndicationCode: code }}
      examination={{}}
      readOnly
      onEdit={() => {}}
    />,
  );
  expect(indicationCell()?.textContent).toBe(code);
  expect(indicationCell()?.children.length).toBe(code ? 1 : 0);
});

const selectionCell = () =>
  screen.getByRole('table', { name: 'Графы 1–12 заявки' }).querySelector('tbody td:nth-child(10)');

it.each([
  ['1', 'Гемолитические посттрансфузионные осложнения'],
  ['2', 'Беременность с признаками гемолитической болезни новорожденного'],
  ['3', 'Аллоиммунные антитела к эритроцитам'],
  ['4', 'Аутоиммунные антитела к эритроцитам'],
  ['5', 'Положительные пробы на индивидуальную совместимость'],
  ['6', 'Множественные трансфузии'],
  ['7', 'Возраст до 4 месяцев'],
  ['8', 'Две и более безрезультатные трансфузии тромбоцитов'],
])('показывает расшифровку кода индивидуального подбора %s в графе 10', (code, label) => {
  render(
    <ComponentRequestForm
      values={{ ...request, individualSelectionCode: code }}
      examination={{}}
      readOnly
      onEdit={() => {}}
    />,
  );
  const cell = selectionCell();
  expect(cell?.firstElementChild?.textContent).toBe(code);
  expect(cell?.children[1]?.textContent).toBe(label);
});

it.each(['', '999'])('не придумывает расшифровку кода подбора %s', (code) => {
  render(
    <ComponentRequestForm
      values={{ ...request, individualSelectionCode: code }}
      examination={{}}
      readOnly
      onEdit={() => {}}
    />,
  );
  const cell = selectionCell();
  expect(cell?.textContent).toBe(code);
  expect(cell?.children.length).toBe(code ? 1 : 0);
});
