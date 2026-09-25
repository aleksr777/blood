import { useEffect, useRef, useState } from 'react';
import { getScrollbarMetrics } from './scrollbar-metrics';

export type ScrollbarState = {
  visible: boolean;
  thumbHeight: number;
  thumbTop: number;
  valueNow: number;
};

export type ScrollbarDrag = {
  pointerId: number;
  startY: number;
  startScrollY: number;
};

export const useScrollbarState = () => {
  const [state, setState] = useState<ScrollbarState>({
    visible: false,
    thumbHeight: 40,
    thumbTop: 0,
    valueNow: 0,
  });
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<ScrollbarDrag | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const update = () => {
      frameRef.current = null;
      const scrollbar = getScrollbarMetrics(trackRef.current);

      setState({
        visible: scrollbar.maxScroll > 1,
        thumbHeight: scrollbar.thumbHeight,
        thumbTop: scrollbar.thumbTop,
        valueNow: scrollbar.valueNow,
      });
    };

    const scheduleUpdate = () => {
      if (frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(update);
    };

    scheduleUpdate();
    const delayedUpdate = window.setTimeout(scheduleUpdate, 0);

    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    window.visualViewport?.addEventListener('resize', scheduleUpdate);

    const resizeObserver =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(scheduleUpdate);
    resizeObserver?.observe(document.documentElement);
    resizeObserver?.observe(document.body);
    if (trackRef.current) resizeObserver?.observe(trackRef.current);

    const main = document.querySelector('main');
    if (main) resizeObserver?.observe(main);

    const mutationObserver =
      typeof MutationObserver === 'undefined' ? null : new MutationObserver(scheduleUpdate);
    mutationObserver?.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
      window.clearTimeout(delayedUpdate);
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      window.visualViewport?.removeEventListener('resize', scheduleUpdate);
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
    };
  }, []);

  return { state, trackRef, thumbRef, dragRef };
};
