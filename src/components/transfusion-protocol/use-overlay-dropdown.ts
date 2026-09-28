import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react';

export const useOverlayDropdown = (
  open: boolean,
  setOpen: Dispatch<SetStateAction<boolean>>,
) => {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [setOpen]);

  return {
    rootRef,
    dropdownState: open ? 'open' : 'closed',
  } as const;
};
