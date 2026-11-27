export const getPickerPosition = (anchor: HTMLElement, width: number, height: number) => {
  const bounds = anchor.getBoundingClientRect();
  const dialog = anchor.closest('dialog')?.getBoundingClientRect();
  const topEdge = Math.max(8, dialog?.top ?? 8);
  const bottomEdge = Math.min(window.innerHeight - 8, dialog?.bottom ?? window.innerHeight - 8);
  const visibleHeight = Math.min(height, bottomEdge - topEdge);
  const spaceBelow = bottomEdge - bounds.bottom;
  const spaceAbove = bounds.top - topEdge;
  const above = spaceBelow < visibleHeight && spaceAbove > spaceBelow;
  const top = above
    ? Math.max(topEdge, bounds.top - visibleHeight - 4)
    : Math.min(bottomEdge - visibleHeight, bounds.bottom + 4);
  const left = Math.max(8, Math.min(bounds.left, window.innerWidth - width - 8));
  return { top: Math.max(topEdge, top), left };
};
