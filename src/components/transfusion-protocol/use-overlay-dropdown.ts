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
const OPEN_DELAY_MS = 130;
const CLOSE_DURATION_MS = 110;
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
  const stateRef = useRef<DropdownState>('closed');
  const [dropdownState, setDropdownState] = useState<DropdownState>('closed');

  const changeState = (nextState: DropdownState) => {
    stateRef.current = nextState;
    setDropdownState(nextState);
  };

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
      changeState('preparing');
      updateSpace();
      timerRef.current = window.setTimeout(() => {
        changeState('open');
        timerRef.current = null;
      }, OPEN_DELAY_MS);
    } else if (stateRef.current !== 'closed') {
      changeState('closing');
      timerRef.current = window.setTimeout(() => {
        changeState('closed');
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
  }, [open]);

  return { rootRef, dropdownRef, dropdownState };
};
