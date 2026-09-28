import {
  useEffect,
  useLayoutEffect,
  useRef,
  type Dispatch,
  type SetStateAction,
} from 'react';

const SPACE_VARIABLE = '--modal-dropdown-space';
const HEIGHT_VARIABLE = '--dropdown-height';
const DROPDOWN_GAP = 8;
const MOTION_DURATION_MS = 120;
const MAX_DROPDOWN_REM = 12;
const DROPDOWN_CHROME_PX = 10;

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

    const getDropdownHeight = () => {
      const rootFontSize = Number.parseFloat(
        getComputedStyle(document.documentElement).fontSize,
      );
      const maxHeight = MAX_DROPDOWN_REM * (rootFontSize || 16);
      return Math.min(dropdown.scrollHeight + DROPDOWN_CHROME_PX, maxHeight);
    };

    const setDropdownHeight = () => {
      const height = getDropdownHeight();
      dropdown.style.setProperty(HEIGHT_VARIABLE, `${height}px`);
      return height;
    };

    const setInitialSpace = () => {
      const height = setDropdownHeight();
      const dropdownBottom =
        root.getBoundingClientRect().top +
        dropdown.offsetTop +
        height +
        DROPDOWN_GAP;
      const overflow = Math.ceil(dropdownBottom - dialog.getBoundingClientRect().bottom);
      const nextSpace = Math.max(0, overflow);

      spaceRef.current = nextSpace;
      dialog.style.setProperty(SPACE_VARIABLE, `${nextSpace}px`);
    };

    const updateSettledSpace = () => {
      const height = setDropdownHeight();
      const dropdownBottom =
        root.getBoundingClientRect().top +
        dropdown.offsetTop +
        height +
        DROPDOWN_GAP;
      const overflow = Math.ceil(dropdownBottom - dialog.getBoundingClientRect().bottom);
      const nextSpace = Math.max(0, spaceRef.current + overflow);

      spaceRef.current = nextSpace;
      dialog.style.setProperty(SPACE_VARIABLE, `${nextSpace}px`);
    };

    if (!open) {
      spaceRef.current = 0;
      dialog.style.setProperty(SPACE_VARIABLE, '0px');
      return;
    }

    setInitialSpace();

    let observer: ResizeObserver | null = null;
    const timer = window.setTimeout(() => {
      observer = new ResizeObserver(updateSettledSpace);
      observer.observe(dropdown);
      window.addEventListener('resize', updateSettledSpace);
    }, MOTION_DURATION_MS);

    return () => {
      window.clearTimeout(timer);
      observer?.disconnect();
      window.removeEventListener('resize', updateSettledSpace);
    };
  }, [open]);

  return {
    rootRef,
    dropdownRef,
    dropdownState: open ? 'open' : 'closed',
  } as const;
};
