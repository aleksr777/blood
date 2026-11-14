// @vitest-environment jsdom
import { useState } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
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

it('saves user-entered names separately and never changes the official preset list', async () => {
  render(<Harness />);
  fireEvent.click(screen.getByRole('button', { name: 'Гранулоциты' }));
  const input = screen.getByRole('textbox', { name: selectName });
  fireEvent.change(input, { target: { value: 'Индивидуальный компонент' } });
  fireEvent.blur(input);
  await waitFor(() =>
    expect(rememberSavedOption).toHaveBeenCalledWith(
      'componentName:granulocytes',
      'Индивидуальный компонент',
    ),
  );
});

it('shows only component names in the coded request dropdown while returning codes', () => {
  const onCodeChange = vi.fn();
  render(
    <BloodComponentSelector
      group="granulocytes"
      name=""
      catalogOptions={componentCatalogForGroup('granulocytes')}
      selectedCode=""
      onCodeChange={onCodeChange}
      onChange={vi.fn()}
    />,
  );
  const option = screen.getByRole('option', { name: firstName }) as HTMLOptionElement;
  expect(option.value).toBe('ГКО');
  expect(option.textContent).toBe(firstName);
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'ГКО' } });
  expect(onCodeChange).toHaveBeenCalledWith('ГКО');
});
