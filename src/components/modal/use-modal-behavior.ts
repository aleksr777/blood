import { useEffect, useId, useRef, useState } from 'react';
import { addOpenDialog, removeOpenDialog } from './modal-scroll-lock';
import { bindModalScrollGuards } from './modal-scroll-guards';

const OPEN_DURATION_MS = 400;
const CLOSE_DURATION_MS = 400;

export const useModalBehavior = (onClose: () => void, dismissible: boolean) => {
  const ref = useRef<HTMLDialogElement>(null);
  const closeTimer = useRef<number | null>(null);
  const openTimer = useRef<number | null>(null);
  const openFrame = useRef<number | null>(null);
  const canPointerClose = useRef(false);
  const closing = useRef(false);
  const label = useId();
  const [state, setState] = useState<'opening' | 'open' | 'closing'>('opening');

  const requestClose = () => {
    if (!dismissible || closing.current) return;
    closing.current = true;
    setState('closing');
    closeTimer.current = window.setTimeout(onClose, CLOSE_DURATION_MS);
  };

  const requestPointerClose = () => {
    if (!canPointerClose.current) return;
    requestClose();
  };

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const priorFocus = document.activeElement as HTMLElement | null;
    dialog.showModal();
    addOpenDialog(dialog);
    const unbindScrollGuards = bindModalScrollGuards(dialog);

    openFrame.current = window.requestAnimationFrame(() => {
      setState('open');
      openTimer.current = window.setTimeout(() => {
        canPointerClose.current = true;
      }, OPEN_DURATION_MS);
    });

    return () => {
      if (openFrame.current !== null) window.cancelAnimationFrame(openFrame.current);
      if (openTimer.current !== null) window.clearTimeout(openTimer.current);
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
      unbindScrollGuards();
      removeOpenDialog(dialog);
      dialog.close();
      priorFocus?.focus({ preventScroll: true });
    };
  }, []);

  return { ref, label, state, requestClose, requestPointerClose };
};
