import {
  useEffect,
  useLayoutEffect,
  useRef,
  type Dispatch,
  type SetStateAction,
} from 'react';

const SPACE_VARIABLE = '--modal-dropdown-space';
const DROPDOWN_GAP = 8;
const RESIZE_TRANSITION_MS = 260;

export const useOverlayDropdown = (
  open: boolean,
  setOpen: Dispatch<SetStateAction<boolean>>,
) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const spaceRef = useRef(0);

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [setOpen]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const dropdown = dropdownRef.current;
    const dialog = root?.closest('dialog');
    if (!dialog || !dropdown) return;

    if (!open) {
      spaceRef.current = 0;
      dialog.style.setProperty(SPACE_VARIABLE, '0px');
      return;
    }

    const updateSpace = () => {
      const overflow = Math.ceil(
        dropdown.getBoundingClientRect().bottom +
          DROPDOWN_GAP -
          dialog.getBoundingClientRect().bottom,
      );
      const nextSpace = Math.max(0, spaceRef.current + overflow);
      spaceRef.current = nextSpace;
      dialog.style.setProperty(SPACE_VARIABLE, `${nextSpace}px`);
    };

    const frame = window.requestAnimationFrame(updateSpace);
    let observer: ResizeObserver | null = null;
    const observerTimer = window.setTimeout(() => {
      observer = new ResizeObserver(updateSpace);
      observer.observe(dropdown);
      window.addEventListener('resize', updateSpace);
    }, RESIZE_TRANSITION_MS);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(observerTimer);
      observer?.disconnect();
      window.removeEventListener('resize', updateSpace);
    };
  }, [open]);

  return { rootRef, dropdownRef };
};
