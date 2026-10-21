import { useCallback, useEffect, useRef } from 'react';

const CHANNEL_NAME = 'blood:working-tab';
const FOCUS_REQUEST = 'focus-working-tab';

export const useWorkingTabFocus = (ready: boolean) => {
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;

    let channel: BroadcastChannel;
    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
    } catch {
      return;
    }
    channelRef.current = channel;
    channel.onmessage = (event: MessageEvent<unknown>) => {
      if (
        ready &&
        typeof event.data === 'object' &&
        event.data !== null &&
        'type' in event.data &&
        event.data.type === FOCUS_REQUEST
      ) {
        // Browsers may ignore this request; the other tab also explains manual switching.
        window.focus();
      }
    };

    return () => {
      channelRef.current = null;
      channel.close();
    };
  }, [ready]);

  return useCallback(() => {
    try {
      channelRef.current?.postMessage({ type: FOCUS_REQUEST });
    } catch {
      // Manual switching remains available if cross-tab messaging is blocked.
    }
  }, []);
};
