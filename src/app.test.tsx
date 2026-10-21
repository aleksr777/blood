// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './app';

vi.mock('./components/blood-requests/component-request', () => ({
  ComponentRequest: () => <div>Component request</div>,
}));
vi.mock('./components/blood-requests/individual-selection-direction', () => ({
  IndividualSelectionDirection: () => <div>Selection direction</div>,
}));
vi.mock('./components/transfusion-protocol/transfusion-protocol', () => ({
  TransfusionProtocol: () => <div>Protocol</div>,
}));
vi.mock('./components/transfusion-registration/transfusion-registration', () => ({
  TransfusionRegistration: () => <div>Registration</div>,
}));
vi.mock('./components/scrollbar/custom-scrollbar', () => ({ default: () => null }));

const navigate = (hash: string) =>
  act(() => {
    window.history.replaceState(null, '', hash);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });

beforeEach(() => {
  vi.useFakeTimers();
  window.history.replaceState(null, '', '#/protocol');
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('page transitions', () => {
  it('cancels a pending transition when navigation returns to the current page', () => {
    render(<App />);
    navigate('#/registration');
    navigate('#/protocol');
    act(() => vi.advanceTimersByTime(300));
    expect(screen.queryByText('Registration')).toBeNull();
    expect(screen.getByText('Protocol')).toBeTruthy();
    expect(document.querySelector('[data-transition-phase="idle"]')).toBeTruthy();
  });

  it('opens the last requested page when several links are followed quickly', () => {
    render(<App />);
    navigate('#/registration');
    navigate('#/component-request');
    navigate('#/summary-request');
    act(() => vi.advanceTimersByTime(300));
    expect(screen.getByText('Selection direction')).toBeTruthy();
    expect(screen.queryByText('Registration')).toBeNull();
  });
});
