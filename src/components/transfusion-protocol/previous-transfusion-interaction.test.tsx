// @vitest-environment jsdom
import { useState, type ReactNode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { RecipientHistoryModal } from './recipient-history-modal';
import type { ProtocolValues } from './protocol-types';

vi.mock('../modal/modal', () => ({
  default: ({ children, onClose }: { children: ReactNode; onClose: () => void }) => (
    <section>
      {children}
      <button onClick={onClose}>Закрыть окно</button>
    </section>
  ),
}));
afterEach(cleanup);
const suggestion = '24.10.2026 — Отмытые эритроциты, 250 мл';
const label = 'Трансфузии компонентов крови в анамнезе';
const manual = () => screen.getByRole('textbox', { name: label }) as HTMLTextAreaElement;
const inserted = () =>
  screen.getByRole('textbox', { name: 'Внесённые данные о предыдущих трансфузиях' });
const values = () => JSON.parse(screen.getByTestId('values').textContent || '{}') as ProtocolValues;
const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }));
const reopen = () => {
  click('Закрыть окно');
  click('Открыть окно');
};
const Harness = ({
  initial = { previousTransfusionsStatus: 'had', previousTransfusions: 'Ручной анамнез' },
  savedDocument = false,
}: {
  initial?: ProtocolValues;
  savedDocument?: boolean;
}) => {
  const [data, setData] = useState(initial);
  const [open, setOpen] = useState(true);
  return (
    <>
      {open ? (
        <RecipientHistoryModal
          values={data}
          savedDocument={savedDocument}
          previousTransfusionSuggestion={suggestion}
          onChange={(patch) => setData((current) => ({ ...current, ...patch }))}
          onClose={() => setOpen(false)}
        />
      ) : (
        <button onClick={() => setOpen(true)}>Открыть окно</button>
      )}
      <output data-testid="values">{JSON.stringify(data)}</output>
    </>
  );
};

it('declines for this opening only, without changing history', () => {
  render(<Harness />);
  const before = values();
  click('Не вносить');
  expect(screen.queryByRole('button', { name: 'Внести' })).toBeNull();
  expect(values()).toEqual(before);
  reopen();
  expect(screen.getByRole('button', { name: 'Внести' })).toBeTruthy();
});

it('protects inserted history at the top and keeps manual additions separate across reopening', () => {
  render(<Harness />);
  click('Внести');
  expect(screen.queryByRole('button', { name: 'Не вносить' })).toBeNull();
  expect(inserted().getAttribute('aria-readonly')).toBe('true');
  expect(inserted().textContent).toBe(suggestion);
  expect(manual().value).toBe('Ручной анамнез');
  fireEvent.change(manual(), { target: { value: 'Дополненный ручной анамнез' } });
  expect(values().previousTransfusions).toBe(`${suggestion}\n\nДополненный ручной анамнез`);
  reopen();
  expect(screen.queryByRole('button', { name: 'Внести' })).toBeNull();
  expect(inserted().textContent).toBe(suggestion);
  expect(manual().value).toBe('Дополненный ручной анамнез');
});

it('removes only the inserted block, immediately offers it again and never duplicates it', () => {
  render(<Harness />);
  click('Внести');
  click('Удалить внесённые данные о трансфузиях');
  expect(values().previousTransfusions).toBe('Ручной анамнез');
  expect(values().previousTransfusionsAutoText).toBe('');
  expect(
    screen.queryByRole('textbox', { name: 'Внесённые данные о предыдущих трансфузиях' }),
  ).toBeNull();
  click('Внести');
  expect(values().previousTransfusions).toBe(`${suggestion}\n\nРучной анамнез`);
});

it('does not duplicate an exact suggestion already entered manually', () => {
  render(
    <Harness initial={{ previousTransfusionsStatus: 'had', previousTransfusions: suggestion }} />,
  );
  click('Внести');
  expect(values().previousTransfusions).toBe(suggestion);
  expect(manual().value).toBe('');
});

it('restores a removed saved block from its own text without substituting a current suggestion', () => {
  render(
    <Harness
      savedDocument
      initial={{
        previousTransfusionsStatus: 'had',
        previousTransfusions: 'Архивная сводка\n\nРучной анамнез',
        previousTransfusionsAutoText: 'Архивная сводка',
      }}
    />,
  );
  expect(inserted().textContent).toBe('Архивная сводка');
  click('Удалить внесённые данные о трансфузиях');
  click('Не вносить');
  reopen();
  click('Внести');
  expect(inserted().textContent).toBe('Архивная сводка');
  expect(values().previousTransfusions).toBe('Архивная сводка\n\nРучной анамнез');
});
