import { useEffect, useLayoutEffect, useRef, type Dispatch, type SetStateAction } from 'react';

const VIEWPORT_EDGE_GAP = 12;
const CONTROL_GAP = 5;

export const getDropdownViewportPlacement = (
  bounds: { top: number; bottom: number },
  viewport: { top: number; bottom: number },
  desiredHeight: number,
) => {
  const below = Math.max(0, viewport.bottom - bounds.bottom - VIEWPORT_EDGE_GAP - CONTROL_GAP);
  const above = Math.max(0, bounds.top - viewport.top - VIEWPORT_EDGE_GAP - CONTROL_GAP);
  const placement = below < desiredHeight && above > below ? 'above' : 'below';
  return { placement, maxHeight: placement === 'above' ? above : below } as const;
};

export const useOverlayDropdown = (open: boolean, setOpen: Dispatch<SetStateAction<boolean>>) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const root = rootRef.current;
    const dropdown = dropdownRef.current;
    if (!root || !dropdown) return;

    // Read the uncapped CSS height before applying the viewport constraint.
    root.style.removeProperty('--dropdown-viewport-max-height');
    const naturalMaxHeight = Number.parseFloat(getComputedStyle(dropdown).maxHeight);
    const desiredHeight = Math.min(dropdown.scrollHeight, naturalMaxHeight || dropdown.scrollHeight);

    const position = () => {
      const viewport = window.visualViewport;
      const top = viewport?.offsetTop ?? 0;
      const bottom = top + (viewport?.height ?? window.innerHeight);
      const { placement, maxHeight } = getDropdownViewportPlacement(
        root.getBoundingClientRect(),
        { top, bottom },
        desiredHeight,
      );
      root.dataset.dropdownPlacement = placement;
      root.style.setProperty('--dropdown-viewport-max-height', `${maxHeight}px`);
    };

    position();
    window.addEventListener('resize', position);
    window.addEventListener('scroll', position, true);
    window.visualViewport?.addEventListener('resize', position);
    window.visualViewport?.addEventListener('scroll', position);

    return () => {
      window.removeEventListener('resize', position);
      window.removeEventListener('scroll', position, true);
      window.visualViewport?.removeEventListener('resize', position);
      window.visualViewport?.removeEventListener('scroll', position);
      root.style.removeProperty('--dropdown-viewport-max-height');
      delete root.dataset.dropdownPlacement;
    };
  }, [open]);

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [setOpen]);

  return { rootRef, dropdownRef, dropdownState: open ? 'open' : 'closed' } as const;
};
