// @vitest-environment jsdom
import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { componentCatalogForGroup } from '../blood-requests/component-request-catalog';
import { formatCodedComponent, parseCodedComponent } from '../../domain/coded-component';
import { BloodComponentSelector } from './blood-component-selector';

vi.mock('../../storage/repositories/saved-options', () => ({
  loadSavedOptions: vi.fn(async () => [{ id: 4, value: 'МОЙ-1. Пользовательский компонент' }]),
  subscribeSavedOptions: () => () => undefined,
}));

afterEach(cleanup);

const CodedHarness = () => {
  const [entry, setEntry] = useState({ code: '', name: '' });
  return (
    <>
      <BloodComponentSelector
        group="erythrocytes"
        name={entry.name}
        selectedCode={entry.code}
        catalogOptions={componentCatalogForGroup('erythrocytes')}
        onCodedChange={setEntry}
        onChange={vi.fn()}
      />
      <output aria-label="Код компонента">{entry.code}</output>
      <output aria-label="Название компонента">{entry.name}</output>
    </>
  );
};

it('shows custom entries above immutable coded options and populates both fields', async () => {
  render(<CodedHarness />);
  const input = screen.getByRole('textbox', { name: 'Идентификационный код (графа 6)' });
  const open = screen.getByRole('button', {
    name: 'Показать сохранённые варианты: Идентификационный код (графа 6)',
  });
  fireEvent.click(open);
  const custom = await screen.findByRole('button', { name: 'МОЙ-1. Пользовательский компонент' });
  const fixed = screen.getByRole('button', {
    name: 'ЭВ-Л. Эритроцитная взвесь лейкоредуцированная',
  });
  expect(custom.compareDocumentPosition(fixed) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  fireEvent.click(custom);
  expect((input as HTMLInputElement).value).toBe('МОЙ-1. Пользовательский компонент');
  expect(screen.getByLabelText('Код компонента').textContent).toBe('МОЙ-1');
  expect(screen.getByLabelText('Название компонента').textContent).toBe(
    'Пользовательский компонент',
  );
  fireEvent.change(input, { target: { value: 'МОЙ-2. Новый вариант' } });
  expect(screen.getByLabelText('Код компонента').textContent).toBe('МОЙ-2');
  expect(screen.getByLabelText('Название компонента').textContent).toBe('Новый вариант');
});

it('parses free-text custom codes while preserving spaces during editing', () => {
  expect(parseCodedComponent('НОВ-7. Собственный вариант ', [])).toEqual({
    code: 'НОВ-7',
    name: 'Собственный вариант ',
  });
  expect(parseCodedComponent('Черновик', [])).toEqual({ code: '', name: 'Черновик' });
  expect(formatCodedComponent({ code: 'ЭВ-Л', name: 'Эритроцитная взвесь' })).toBe(
    'ЭВ-Л. Эритроцитная взвесь',
  );
});

it('clears both code and name through the empty option before entering another component', () => {
  render(<CodedHarness />);
  const toggle = screen.getByRole('button', {
    name: 'Показать сохранённые варианты: Идентификационный код (графа 6)',
  });
  const input = screen.getByRole('textbox', { name: 'Идентификационный код (графа 6)' });
  fireEvent.click(toggle);
  fireEvent.click(
    screen.getByRole('button', { name: 'ЭВ-Л. Эритроцитная взвесь лейкоредуцированная' }),
  );
  fireEvent.click(toggle);
  fireEvent.click(
    screen.getByRole('button', { name: 'Очистить поле: Идентификационный код (графа 6)' }),
  );
  expect((input as HTMLInputElement).value).toBe('');
  expect(document.activeElement).toBe(input);
  expect(screen.getByLabelText('Код компонента').textContent).toBe('');
  expect(screen.getByLabelText('Название компонента').textContent).toBe('');
  fireEvent.change(input, { target: { value: 'Новый компонент' } });
  expect(screen.getByLabelText('Название компонента').textContent).toBe('Новый компонент');
});
