import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';

const SPACE_VARIABLE = '--modal-dropdown-space';
const DROPDOWN_GAP = 8;
const OPEN_DELAY_MS = 260;
const CLOSE_DURATION_MS = 220;
const MAX_DROPDOWN_REM = 12;
const DROPDOWN_CHROME_PX = 10;

type DropdownState = 'closed' | 'preparing' | 'open' | 'closing';

export const useOverlayDropdown = (
  open: boolean,
  setOpen: Dispatch<SetStateAction<boolean>>,
) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const spaceRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const [dropdownState, setDropdownState] = useState<DropdownState>('closed');

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

    const clearTimer = () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = null;
    };

    const updateSpace = () => {
      const rootFontSize = Number.parseFloat(
        getComputedStyle(document.documentElement).fontSize,
      );
      const maxHeight = MAX_DROPDOWN_REM * (rootFontSize || 16);
      const dropdownHeight = Math.min(
        dropdown.scrollHeight + DROPDOWN_CHROME_PX,
        maxHeight,
      );
      const dropdownBottom =
        root.getBoundingClientRect().top +
        dropdown.offsetTop +
        dropdownHeight +
        DROPDOWN_GAP;
      const overflow = Math.ceil(dropdownBottom - dialog.getBoundingClientRect().bottom);
      const nextSpace = Math.max(0, spaceRef.current + overflow);

      spaceRef.current = nextSpace;
      dialog.style.setProperty(SPACE_VARIABLE, `${nextSpace}px`);
    };

    clearTimer();

    if (open) {
      setDropdownState('preparing');
      updateSpace();
      timerRef.current = window.setTimeout(() => {
        setDropdownState('open');
        timerRef.current = null;
      }, OPEN_DELAY_MS);
    } else if (dropdownState !== 'closed') {
      setDropdownState('closing');
      timerRef.current = window.setTimeout(() => {
        setDropdownState('closed');
        spaceRef.current = 0;
        dialog.style.setProperty(SPACE_VARIABLE, '0px');
        timerRef.current = null;
      }, CLOSE_DURATION_MS);
    }

    const observer = new ResizeObserver(() => {
      if (open) updateSpace();
    });
    observer.observe(dropdown);

    const handleResize = () => {
      if (open) updateSpace();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimer();
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [open, dropdownState]);

  return { rootRef, dropdownRef, dropdownState };
};
