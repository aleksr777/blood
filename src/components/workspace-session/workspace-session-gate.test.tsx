// @vitest-environment jsdom
import { StrictMode, useEffect, useState } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WORKSPACE_ACTIVITY_KEY, WORKSPACE_INACTIVITY_MS } from '../../storage/workspace-activity';
import { WorkspaceSessionGate } from './workspace-session-gate';

const mocks = vi.hoisted(() => ({ reset: vi.fn<() => Promise<void>>(), unmount: vi.fn() }));
vi.mock('../../storage/sqlite/database-client', () => ({
  database: { resetWorkingDrafts: mocks.reset },
}));
vi.mock('../modal/use-modal-auto-height', () => ({ useModalAutoHeight: () => undefined }));

const WorkingForm = () => {
  const [draft] = useState(
    () => localStorage.getItem('blood:component-request-direction-draft') ?? '',
  );
  useEffect(() => {
    localStorage.setItem('blood:component-request-direction-draft', draft);
    return mocks.unmount;
  }, [draft]);
  return <input aria-label="Бланк" defaultValue={draft} />;
};
const renderApp = () =>
  render(
    <StrictMode>
      <WorkspaceSessionGate>
        <WorkingForm />
      </WorkspaceSessionGate>
    </StrictMode>,
  );
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  mocks.reset.mockReset().mockResolvedValue(undefined);
  mocks.unmount.mockReset();
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
  vi.restoreAllMocks();
});

describe('workspace session gate', () => {
  it('clears expired storage before mounting any form, including in StrictMode', async () => {
    localStorage.setItem('blood:component-request-direction-draft', 'stale');
    localStorage.setItem(WORKSPACE_ACTIVITY_KEY, String(Date.now() - WORKSPACE_INACTIVITY_MS - 1));
    let finish!: () => void;
    mocks.reset.mockReturnValue(
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
    );
    renderApp();
    expect(screen.queryByRole('textbox')).toBeNull();
    await waitFor(() => expect(mocks.reset).toHaveBeenCalledTimes(1));
    await act(async () => finish());
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('');
  });

  it('unmounts the old editor before resetting and remounts an empty editor on resume', async () => {
    const now = Date.now();
    const clock = vi.spyOn(Date, 'now').mockReturnValue(now);
    localStorage.setItem('blood:component-request-direction-draft', 'stale');
    renderApp();
    expect(((await screen.findByRole('textbox')) as HTMLInputElement).value).toBe('stale');
    mocks.unmount.mockClear();
    mocks.reset.mockImplementation(async () => {
      expect(mocks.unmount).toHaveBeenCalled();
      expect(screen.queryByRole('textbox')).toBeNull();
    });
    clock.mockReturnValue(now + WORKSPACE_INACTIVITY_MS + 1);
    fireEvent(window, new Event('pageshow'));
    await waitFor(() => expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe(''));
    expect(mocks.reset).toHaveBeenCalledTimes(1);
  });

  it('keeps stale forms unmounted after a reset failure and retries the unfinished reset', async () => {
    localStorage.setItem(WORKSPACE_ACTIVITY_KEY, String(Date.now() - WORKSPACE_INACTIVITY_MS - 1));
    mocks.reset.mockRejectedValueOnce(new Error('Недостаточно места.'));
    renderApp();
    await screen.findByRole('dialog', { name: 'Не удалось очистить рабочие бланки' });
    expect(screen.queryByRole('textbox')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(await screen.findByRole('textbox')).toBeTruthy();
    expect(mocks.reset).toHaveBeenCalledTimes(2);
  });
});
