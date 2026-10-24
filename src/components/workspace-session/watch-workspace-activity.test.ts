// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WORKSPACE_ACTIVITY_KEY, WORKSPACE_INACTIVITY_MS } from '../../storage/workspace-activity';
import { watchWorkspaceActivity } from './watch-workspace-activity';

const now = new Date('2026-10-24T10:00:00Z').getTime();
const hour = 60 * 60 * 1000;
let stop: (() => void) | undefined;
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
  localStorage.clear();
  localStorage.setItem(WORKSPACE_ACTIVITY_KEY, String(now));
});
afterEach(() => {
  stop?.();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('workspace activity tracking', () => {
  it('expires only after 24 hours and disposes its timer and listeners', () => {
    const expire = vi.fn();
    stop = watchWorkspaceActivity(expire);
    vi.advanceTimersByTime(WORKSPACE_INACTIVITY_MS);
    expect(expire).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(expire).toHaveBeenCalledTimes(1);
    window.dispatchEvent(new Event('focus'));
    expect(expire).toHaveBeenCalledTimes(1);
    stop();
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each(['pointerdown', 'pointermove', 'keydown', 'input', 'click', 'wheel', 'touchmove'])(
    'extends the whole session on %s even without editing a form',
    (event) => {
      const expire = vi.fn();
      stop = watchWorkspaceActivity(expire);
      vi.advanceTimersByTime(23 * hour);
      document.body.dispatchEvent(new Event(event, { bubbles: true }));
      expect(localStorage.getItem(WORKSPACE_ACTIVITY_KEY)).toBe(String(now + 23 * hour));
      vi.advanceTimersByTime(23 * hour);
      expect(expire).not.toHaveBeenCalled();
      vi.advanceTimersByTime(hour + 1);
      expect(expire).toHaveBeenCalledTimes(1);
    },
  );

  it.each(['focus', 'pageshow', 'visibilitychange', 'resume'])(
    'checks sleeping or restored tabs on %s without counting focus as activity',
    (name) => {
      const expire = vi.fn();
      stop = watchWorkspaceActivity(expire);
      vi.setSystemTime(now + 23 * hour);
      const target = name === 'visibilitychange' || name === 'resume' ? document : window;
      target.dispatchEvent(new Event(name));
      expect(expire).not.toHaveBeenCalled();
      expect(localStorage.getItem(WORKSPACE_ACTIVITY_KEY)).toBe(String(now));
      vi.setSystemTime(now + 25 * hour);
      target.dispatchEvent(new Event(name));
      expect(expire).toHaveBeenCalledTimes(1);
    },
  );

  it('blocks the first stale save click after sleep before the button handler can run', () => {
    const expire = vi.fn();
    const save = vi.fn();
    const button = document.createElement('button');
    document.body.append(button);
    button.addEventListener('click', save);
    stop = watchWorkspaceActivity(expire);
    vi.setSystemTime(now + 25 * hour);
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    button.dispatchEvent(click);
    expect(expire).toHaveBeenCalledTimes(1);
    expect(save).not.toHaveBeenCalled();
    expect(click.defaultPrevented).toBe(true);
    expect(localStorage.getItem(WORKSPACE_ACTIVITY_KEY)).toBe(String(now));
    button.remove();
  });

  it('throttles pointer writes and flushes the exact last input time when leaving', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    stop = watchWorkspaceActivity(vi.fn());
    vi.advanceTimersByTime(100);
    window.dispatchEvent(new Event('pointermove'));
    vi.advanceTimersByTime(100);
    window.dispatchEvent(new Event('pointermove'));
    expect(setItem).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    window.dispatchEvent(new Event('pagehide'));
    expect(localStorage.getItem(WORKSPACE_ACTIVITY_KEY)).toBe(String(now + 200));
  });
});
