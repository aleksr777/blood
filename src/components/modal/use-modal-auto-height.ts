import { useEffect, type RefObject } from 'react';

const SIZE_TOLERANCE_PX = 0.5;

const parsePixels = (value: string) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const useModalAutoHeight = (
  dialogRef: RefObject<HTMLDialogElement | null>,
  contentRef: RefObject<HTMLDivElement | null>,
) => {
  useEffect(() => {
    const dialog = dialogRef.current;
    const content = contentRef.current;
    if (!dialog || !content) return undefined;

    let measureFrame: number | null = null;
    let readyFrame: number | null = null;
    let initialized = false;

    const updateHeight = () => {
      if (measureFrame !== null) {
        window.cancelAnimationFrame(measureFrame);
      }

      measureFrame = window.requestAnimationFrame(() => {
        measureFrame = null;

        const dialogStyle = window.getComputedStyle(dialog);
        const borderHeight =
          parsePixels(dialogStyle.borderTopWidth) + parsePixels(dialogStyle.borderBottomWidth);
        const naturalHeight = content.offsetHeight + borderHeight;
        if (naturalHeight <= 0) return;

        const parsedMaxHeight = Number.parseFloat(dialogStyle.maxHeight);
        const maximumHeight = Number.isFinite(parsedMaxHeight)
          ? parsedMaxHeight
          : window.innerHeight;
        const targetHeight = Math.min(naturalHeight, maximumHeight);

        dialog.dataset.sizeScrollable = String(
          naturalHeight > maximumHeight + SIZE_TOLERANCE_PX,
        );
        dialog.style.height = `${targetHeight}px`;

        if (!initialized) {
          initialized = true;
          readyFrame = window.requestAnimationFrame(() => {
            readyFrame = null;
            dialog.dataset.sizeReady = 'true';
          });
        }
      });
    };

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(content);
    window.addEventListener('resize', updateHeight);

    return () => {
      if (measureFrame !== null) {
        window.cancelAnimationFrame(measureFrame);
      }
      if (readyFrame !== null) {
        window.cancelAnimationFrame(readyFrame);
      }
      observer.disconnect();
      window.removeEventListener('resize', updateHeight);
      delete dialog.dataset.sizeReady;
      delete dialog.dataset.sizeScrollable;
      dialog.style.removeProperty('height');
    };
  }, [dialogRef, contentRef]);
};
