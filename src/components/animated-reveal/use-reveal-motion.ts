import { useLayoutEffect, useRef, type RefObject } from 'react';

export const useRevealMotion = (
  ref: RefObject<HTMLDivElement>,
  { open, present, contentKey }: { open: boolean; present: boolean; contentKey?: string | number },
  onHidden: () => void,
) => {
  const height = useRef(0);
  const hiddenRef = useRef(onHidden);
  hiddenRef.current = onHidden;

  useLayoutEffect(() => {
    const root = ref.current;
    const content = root?.firstElementChild as HTMLElement | null;
    if (!root || !content) return;
    root.inert = !open;
    if (!present) return;

    let animation: Animation | null = null;
    let target = -1;
    let active = true;
    const resize = () => {
      const next = open ? content.getBoundingClientRect().height : 0;
      if (Math.abs(next - target) < 0.5) return;
      target = next;
      const from = animation ? root.getBoundingClientRect().height : height.current;
      const opacity = Number.parseFloat(getComputedStyle(root).opacity) || 0;
      animation?.cancel();
      root.style.height = `${from}px`;
      root.style.opacity = String(opacity);
      root.style.overflow = 'hidden';
      const duration = Number.parseFloat(
        getComputedStyle(root).getPropertyValue('--reveal-duration'),
      );
      const finish = () => {
        height.current = next;
        root.style.height = open ? 'auto' : '0px';
        root.style.opacity = open ? '1' : '0';
        root.style.overflow = open ? 'visible' : 'hidden';
        delete root.dataset.animating;
        animation?.cancel();
        animation = null;
        if (!open) hiddenRef.current();
      };
      if (
        duration === 0 ||
        !root.animate ||
        (Math.abs(from - next) < 0.5 && opacity === Number(open))
      ) {
        finish();
        return;
      }
      root.dataset.animating = 'true';
      const current = root.animate(
        [
          { height: `${from}px`, opacity },
          { height: `${next}px`, opacity: Number(open) },
        ],
        {
          duration: Number.isFinite(duration) ? duration : 180,
          easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)',
          fill: 'both',
        },
      );
      animation = current;
      void current.finished
        .then(() => {
          if (active && animation === current) finish();
        })
        .catch(() => undefined);
    };
    resize();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize);
    observer?.observe(content);
    return () => {
      active = false;
      if (animation) {
        height.current = root.getBoundingClientRect().height;
        root.style.height = `${height.current}px`;
        root.style.opacity = getComputedStyle(root).opacity;
      }
      animation?.cancel();
      observer?.disconnect();
      delete root.dataset.animating;
    };
  }, [ref, open, present, contentKey]);
};
