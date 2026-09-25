const MIN_THUMB_HEIGHT = 40;

export const getScrollbarMetrics = (track: HTMLDivElement | null) => {
  const scrollingElement = document.scrollingElement ?? document.documentElement;
  const viewportHeight = scrollingElement.clientHeight || window.innerHeight;
  const documentHeight = scrollingElement.scrollHeight;
  const maxScroll = Math.max(documentHeight - viewportHeight, 0);
  const trackHeight = track?.clientHeight || viewportHeight;
  const trackTop = track?.getBoundingClientRect().top ?? 0;
  const minThumbHeight = track
    ? Number.parseFloat(window.getComputedStyle(track).getPropertyValue('--thumb-min-height')) ||
      MIN_THUMB_HEIGHT
    : MIN_THUMB_HEIGHT;
  const thumbHeight =
    maxScroll > 0
      ? Math.min(
          trackHeight,
          Math.max((viewportHeight / documentHeight) * trackHeight, minThumbHeight),
        )
      : trackHeight;
  const thumbTravel = Math.max(trackHeight - thumbHeight, 0);
  const scrollTop = Math.min(Math.max(scrollingElement.scrollTop, 0), maxScroll);
  const thumbTop = maxScroll > 0 ? (scrollTop / maxScroll) * thumbTravel : 0;
  const valueNow = maxScroll > 0 ? Math.round((scrollTop / maxScroll) * 100) : 0;

  return { maxScroll, trackTop, thumbHeight, thumbTravel, thumbTop, valueNow };
};
