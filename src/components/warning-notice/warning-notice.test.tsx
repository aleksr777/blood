// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { WarningNotice } from './warning-notice';

afterEach(cleanup);

it('dismisses a notice and shows a changed warning again', () => {
  const onDismiss = vi.fn();
  const { rerender } = render(
    <WarningNotice message="Истёк срок 01.01.2020" onDismiss={onDismiss} />,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Закрыть предупреждение' }));
  expect(screen.queryByRole('alert')).toBeNull();
  expect(onDismiss).toHaveBeenCalledTimes(1);
  rerender(<WarningNotice message="Истёк срок 02.01.2020" onDismiss={onDismiss} />);
  expect(screen.getByRole('alert').textContent).toContain('02.01.2020');
});

it('cannot hide a mandatory warning after a dismissible exception changes', () => {
  const onDismiss = vi.fn();
  const { rerender } = render(
    <WarningNotice message="Группы не совпадают" onDismiss={onDismiss} />,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Закрыть предупреждение' }));
  expect(screen.queryByRole('alert')).toBeNull();
  rerender(
    <WarningNotice message="Группы не совпадают" dismissible={false} onDismiss={onDismiss} />,
  );
  expect(screen.getByRole('alert').textContent).toBe('Группы не совпадают');
  expect(screen.queryByRole('button', { name: 'Закрыть предупреждение' })).toBeNull();
  expect(onDismiss).toHaveBeenCalledTimes(1);
});
