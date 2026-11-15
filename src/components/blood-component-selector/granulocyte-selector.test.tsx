// @vitest-environment jsdom
import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { componentCatalogForGroup } from '../blood-requests/component-request-catalog';
import { rememberSavedOption } from '../../storage/repositories/saved-options';
import { BloodComponentSelector } from './blood-component-selector';

vi.mock('../../storage/repositories/saved-options', () => ({
  loadSavedOptions: vi.fn(async () => []),
  subscribeSavedOptions: () => () => undefined,
  rememberSavedOption: vi.fn(async () => []),
}));
beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

const selectName = 'Наименование компонента донорской крови';
const firstName = 'Концентрат гранулоцитов, полученный методом афереза, облучённый';
const secondName = 'Концентрат гранулоцитов пулированный, облучённый';
const Harness = () => {
  const [selection, setSelection] = useState({ group: '', name: '' });
  return <BloodComponentSelector {...selection} onChange={setSelection} />;
};

it('offers a fourth component group with exactly two immutable granulocyte presets', () => {
  render(<Harness />);
  expect(
    screen.getAllByRole('button').filter((button) => button.hasAttribute('data-component')),
  ).toHaveLength(4);
  const button = screen.getByRole('button', { name: 'Гранулоциты' });
  expect(button.getAttribute('data-component')).toBe('granulocytes');
  fireEvent.click(button);
  expect(button.getAttribute('aria-pressed')).toBe('true');
  fireEvent.click(
    screen.getByRole('button', { name: `Показать сохранённые варианты: ${selectName}` }),
  );
  expect(screen.getByRole('button', { name: firstName })).toBeTruthy();
  expect(screen.getByRole('button', { name: secondName })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Отмытые эритроциты' })).toBeNull();
  expect(screen.queryByText('ГКО')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: firstName }));
  expect((screen.getByRole('textbox', { name: selectName }) as HTMLInputElement).value).toBe(
    firstName,
  );
  fireEvent.blur(screen.getByRole('textbox', { name: selectName }));
  expect(rememberSavedOption).not.toHaveBeenCalled();
});

it('keeps new custom names in the draft without saving them on blur', () => {
  render(<Harness />);
  fireEvent.click(screen.getByRole('button', { name: 'Гранулоциты' }));
  const input = screen.getByRole('textbox', { name: selectName }) as HTMLInputElement;
  fireEvent.change(input, { target: { value: 'Индивидуальный компонент' } });
  fireEvent.blur(input);
  expect(input.value).toBe('Индивидуальный компонент');
  expect(rememberSavedOption).not.toHaveBeenCalled();
});

it('shows code-prefixed names in the request selector while keeping codes separate', () => {
  const onCodedChange = vi.fn();
  render(
    <BloodComponentSelector
      group="granulocytes"
      name=""
      catalogOptions={componentCatalogForGroup('granulocytes')}
      selectedCode=""
      onCodedChange={onCodedChange}
      onChange={vi.fn()}
    />,
  );
  const input = screen.getByRole('textbox', { name: 'Идентификационный код (графа 6)' });
  fireEvent.click(
    screen.getByRole('button', {
      name: 'Показать сохранённые варианты: Идентификационный код (графа 6)',
    }),
  );
  fireEvent.click(screen.getByRole('button', { name: `ГКО. ${firstName}` }));
  expect(onCodedChange).toHaveBeenCalledWith({ code: 'ГКО', name: firstName });
  expect(input).toBeTruthy();
});
