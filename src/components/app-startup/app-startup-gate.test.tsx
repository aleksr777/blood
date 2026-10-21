// @vitest-environment jsdom
import { StrictMode, useEffect } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DatabaseError } from '../../storage/sqlite/database-errors';
import { AppStartupGate } from './app-startup-gate';

const { initialize } = vi.hoisted(() => ({ initialize: vi.fn<() => Promise<void>>() }));
vi.mock('../../storage/sqlite/database-client', () => ({ initializeDatabase: initialize }));
vi.mock('../modal/use-modal-auto-height', () => ({ useModalAutoHeight: () => undefined }));

const busy = new DatabaseError('База занята другой вкладкой.', 'database-in-use');
const DraftEditor = () => {
  useEffect(() => localStorage.setItem('draft', 'edited'), []);
  return <input aria-label="Бланк" />;
};
const renderApp = () =>
  render(
    <StrictMode>
      <AppStartupGate>
        <DraftEditor />
      </AppStartupGate>
    </StrictMode>,
  );

beforeEach(() => {
  initialize.mockReset().mockResolvedValue(undefined);
  localStorage.clear();
  vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.setAttribute('open', '');
      },
    },
    close: {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.removeAttribute('open');
      },
    },
  });
});
afterEach(() => {
  cleanup();
});

describe('application startup', () => {
  it('keeps forms unmounted until the database is ready, including in StrictMode', async () => {
    let finish!: () => void;
    const opening = new Promise<void>((resolve) => {
      finish = resolve;
    });
    initialize.mockReturnValue(opening);
    renderApp();
    expect(screen.getByRole('status').textContent).toContain('Открываем');
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(localStorage.getItem('draft')).toBeNull();
    await act(async () => finish());
    expect(screen.getByRole('textbox')).toBeTruthy();
    expect(localStorage.getItem('draft')).toBe('edited');
  });

  it('blocks duplicate tabs without editing drafts or allowing dismissal', async () => {
    initialize.mockRejectedValue(busy);
    localStorage.setItem('draft', 'saved');
    renderApp();
    const dialog = await screen.findByRole('dialog', { name: 'Приложение уже открыто' });
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    await act(async () => new Promise((resolve) => window.setTimeout(resolve, 200)));
    fireEvent(dialog, new Event('cancel', { bubbles: true, cancelable: true }));
    fireEvent.click(dialog);
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(localStorage.getItem('draft')).toBe('saved');
    expect(dialog.hasAttribute('open')).toBe(true);
  });

  it('keeps the warning open after the working tab releases the database', async () => {
    initialize.mockRejectedValue(busy);
    renderApp();
    const dialog = await screen.findByRole('dialog');
    initialize.mockResolvedValue(undefined);
    fireEvent(window, new Event('focus'));
    fireEvent(window, new HashChangeEvent('hashchange'));
    expect(initialize).toHaveBeenCalledTimes(2);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(dialog.hasAttribute('open')).toBe(true);
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('shows other database failures with a retry instead of editable forms', async () => {
    initialize.mockRejectedValue(new Error('Недостаточно места на диске.'));
    renderApp();
    await screen.findByRole('dialog', { name: 'Не удалось открыть приложение' });
    expect(screen.getByText('Недостаточно места на диске.')).toBeTruthy();
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Перейти в рабочую вкладку' })).toBeNull();
    initialize.mockResolvedValue(undefined);
    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(await screen.findByRole('textbox')).toBeTruthy();
  });
});
