import { canScrollWithinDialog, isTopmostDialog } from './modal-scroll-lock';

export const bindModalScrollGuards = (dialog: HTMLDialogElement) => {
  let touchY: number | null = null;
  const isTopmost = () => isTopmostDialog(dialog);

  const preventBackgroundWheel = (event: WheelEvent) => {
    if (!isTopmost()) return;
    if (!canScrollWithinDialog(event.target, dialog, event.deltaY)) event.preventDefault();
  };

  const rememberTouch = (event: TouchEvent) => {
    if (!isTopmost()) return;
    touchY = event.touches[0]?.clientY ?? null;
  };

  const preventBackgroundTouch = (event: TouchEvent) => {
    if (!isTopmost()) return;
    const nextY = event.touches[0]?.clientY;
    if (nextY === undefined || touchY === null) {
      event.preventDefault();
      return;
    }
    const deltaY = touchY - nextY;
    touchY = nextY;
    if (!canScrollWithinDialog(event.target, dialog, deltaY)) event.preventDefault();
  };

  const preventBackgroundKeys = (event: KeyboardEvent) => {
    if (!isTopmost()) return;
    const target = event.target;
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      (target instanceof HTMLElement && target.isContentEditable)
    ) {
      return;
    }
    const deltas: Record<string, number> = {
      ArrowDown: 40,
      ArrowUp: -40,
      PageDown: dialog.clientHeight,
      PageUp: -dialog.clientHeight,
      Home: Number.NEGATIVE_INFINITY,
      End: Number.POSITIVE_INFINITY,
      ' ': event.shiftKey ? -dialog.clientHeight : dialog.clientHeight,
    };
    const deltaY = deltas[event.key];
    if (deltaY === undefined) return;
    if (!canScrollWithinDialog(target, dialog, deltaY)) event.preventDefault();
  };

  document.addEventListener('wheel', preventBackgroundWheel, { passive: false });
  document.addEventListener('touchstart', rememberTouch, { passive: true });
  document.addEventListener('touchmove', preventBackgroundTouch, { passive: false });
  document.addEventListener('keydown', preventBackgroundKeys);

  return () => {
    document.removeEventListener('wheel', preventBackgroundWheel);
    document.removeEventListener('touchstart', rememberTouch);
    document.removeEventListener('touchmove', preventBackgroundTouch);
    document.removeEventListener('keydown', preventBackgroundKeys);
  };
};
