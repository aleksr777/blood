// @vitest-environment jsdom
import { StrictMode, type PropsWithChildren } from 'react';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useWorkingTabFocus } from './use-working-tab-focus';

class TestChannel {
  static channels = new Set<TestChannel>();
  onmessage: ((event: MessageEvent) => void) | null = null;

  constructor(readonly name: string) {
    TestChannel.channels.add(this);
  }

  postMessage(data: unknown) {
    TestChannel.channels.forEach((channel) => {
      if (channel !== this && channel.name === this.name) {
        channel.onmessage?.(new MessageEvent('message', { data }));
      }
    });
  }

  close() {
    TestChannel.channels.delete(this);
  }
}

beforeEach(() => {
  TestChannel.channels.clear();
  vi.stubGlobal('BroadcastChannel', TestChannel);
  vi.spyOn(window, 'focus').mockImplementation(() => undefined);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('working tab focus', () => {
  it('only asks a tab with an open database to focus', () => {
    const owner = renderHook(({ ready }) => useWorkingTabFocus(ready), {
      initialProps: { ready: false },
    });
    const duplicate = renderHook(() => useWorkingTabFocus(false));
    act(() => duplicate.result.current());
    expect(window.focus).not.toHaveBeenCalled();
    owner.rerender({ ready: true });
    act(() => duplicate.result.current());
    expect(window.focus).toHaveBeenCalledTimes(1);
  });

  it('closes channels on unmount and safely reconnects in StrictMode', () => {
    const wrapper = ({ children }: PropsWithChildren) => <StrictMode>{children}</StrictMode>;
    const owner = renderHook(() => useWorkingTabFocus(true), { wrapper });
    const duplicate = renderHook(() => useWorkingTabFocus(false));
    expect(TestChannel.channels.size).toBe(2);
    act(() => duplicate.result.current());
    expect(window.focus).toHaveBeenCalledTimes(1);
    owner.unmount();
    act(() => duplicate.result.current());
    expect(window.focus).toHaveBeenCalledTimes(1);
    duplicate.unmount();
    expect(TestChannel.channels.size).toBe(0);
  });

  it('does not throw when the browser blocks cross-tab messaging', () => {
    vi.stubGlobal(
      'BroadcastChannel',
      class {
        constructor() {
          throw new Error('Messaging is blocked');
        }
      },
    );
    const { result } = renderHook(() => useWorkingTabFocus(false));
    expect(() => result.current()).not.toThrow();
  });
});
