import type { KeyboardEvent, PointerEvent } from 'react';
import { getScrollbarMetrics } from './scrollbar-metrics';
import styles from './custom-scrollbar.module.css';
import { useScrollbarState } from './use-scrollbar-state';

const CustomScrollbar = () => {
  const { state, trackRef, thumbRef, dragRef } = useScrollbarState();

  const scrollFromTrackPosition = (clientY: number) => {
    const metrics = getScrollbarMetrics(trackRef.current);
    if (metrics.maxScroll <= 0 || metrics.thumbTravel <= 0) return;

    const nextThumbTop = Math.min(
      Math.max(clientY - metrics.trackTop - metrics.thumbHeight / 2, 0),
      metrics.thumbTravel,
    );

    window.scrollTo({ top: (nextThumbTop / metrics.thumbTravel) * metrics.maxScroll });
  };

  const handleTrackPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || event.target === thumbRef.current) return;
    event.preventDefault();
    scrollFromTrackPosition(event.clientY);
  };

  const handleThumbPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();

    dragRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startScrollY: (document.scrollingElement ?? document.documentElement).scrollTop,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleThumbPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const metrics = getScrollbarMetrics(trackRef.current);
    if (metrics.maxScroll <= 0 || metrics.thumbTravel <= 0) return;

    const deltaY = event.clientY - drag.startY;
    window.scrollTo({
      top: drag.startScrollY + (deltaY / metrics.thumbTravel) * metrics.maxScroll,
    });
  };

  const stopDragging = (event: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;

    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const page = Math.max(window.innerHeight * 0.9, 1);
    const commands: Record<string, number> = {
      ArrowDown: 40,
      ArrowUp: -40,
      PageDown: page,
      PageUp: -page,
      ' ': event.shiftKey ? -page : page,
    };

    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      const top = event.key === 'Home' ? 0 : getScrollbarMetrics(trackRef.current).maxScroll;
      window.scrollTo({ top });
      return;
    }

    const delta = commands[event.key];
    if (delta === undefined) return;

    event.preventDefault();
    window.scrollBy({ top: delta });
  };

  return (
    <div
      ref={trackRef}
      className={[styles.track, state.visible ? styles.visible : styles.hidden].join(' ')}
      role="scrollbar"
      aria-label="Прокрутка страницы"
      aria-orientation="vertical"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={state.valueNow}
      aria-hidden={!state.visible}
      tabIndex={state.visible ? 0 : -1}
      onKeyDown={handleKeyDown}
      onPointerDown={handleTrackPointerDown}
    >
      <div
        ref={thumbRef}
        className={styles.thumb}
        style={{
          height: state.thumbHeight + 'px',
          transform: 'translateY(' + state.thumbTop + 'px)',
        }}
        onPointerDown={handleThumbPointerDown}
        onPointerMove={handleThumbPointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
      />
    </div>
  );
};

export default CustomScrollbar;
