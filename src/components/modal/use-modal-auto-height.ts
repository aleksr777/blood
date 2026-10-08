import { useEffect, type RefObject } from 'react';

const SIZE_TOLERANCE_PX = 0.5;
const SIZE_TRANSITION_FALLBACK_MS = 260;

const parsePixels = (value: string) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getAddedTextareas = (node: Node) => {
  if (node instanceof HTMLTextAreaElement) return [node];
  if (node instanceof HTMLElement) {
    return Array.from(node.querySelectorAll<HTMLTextAreaElement>('textarea'));
  }
  return [];
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
    let settleTimer: number | null = null;
    let initialized = false;
    let previousHeight: number | null = null;

    const revealEnteringTextareas = () => {
      content
        .querySelectorAll<HTMLTextAreaElement>('textarea[data-modal-textarea-entering]')
        .forEach((textarea) => {
          delete textarea.dataset.modalTextareaEntering;
        });
      delete dialog.dataset.sizeAnimating;

      if (settleTimer !== null) {
        window.clearTimeout(settleTimer);
        settleTimer = null;
      }
    };

    const armRevealFallback = () => {
      if (settleTimer !== null) {
        window.clearTimeout(settleTimer);
      }
      settleTimer = window.setTimeout(
        revealEnteringTextareas,
        SIZE_TRANSITION_FALLBACK_MS,
      );
    };

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
        const heightChanged =
          previousHeight !== null &&
          Math.abs(targetHeight - previousHeight) > SIZE_TOLERANCE_PX;
        const hasEnteringTextarea = Boolean(
          content.querySelector('textarea[data-modal-textarea-entering]'),
        );

        dialog.dataset.sizeScrollable = String(
          naturalHeight > maximumHeight + SIZE_TOLERANCE_PX,
        );

        if (initialized && heightChanged && hasEnteringTextarea) {
          dialog.dataset.sizeAnimating = 'true';
          armRevealFallback();
        }

        dialog.style.height = `${targetHeight}px`;
        previousHeight = targetHeight;

        if (!initialized) {
          initialized = true;
          readyFrame = window.requestAnimationFrame(() => {
            readyFrame = null;
            dialog.dataset.sizeReady = 'true';
          });
        } else if (hasEnteringTextarea && !heightChanged) {
          revealEnteringTextareas();
        }
      });
    };

    const contentMutationObserver = new MutationObserver((mutations) => {
      if (!initialized) return;

      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          getAddedTextareas(node).forEach((textarea) => {
            textarea.dataset.modalTextareaEntering = 'true';
          });
        });
      });
    });

    const handleTransitionEnd = (event: TransitionEvent) => {
      if (event.target !== dialog || event.propertyName !== 'height') return;
      revealEnteringTextareas();
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(content);
    contentMutationObserver.observe(content, { childList: true, subtree: true });
    dialog.addEventListener('transitionend', handleTransitionEnd);
    window.addEventListener('resize', updateHeight);

    return () => {
      if (measureFrame !== null) {
        window.cancelAnimationFrame(measureFrame);
      }
      if (readyFrame !== null) {
        window.cancelAnimationFrame(readyFrame);
      }
      if (settleTimer !== null) {
        window.clearTimeout(settleTimer);
      }
      resizeObserver.disconnect();
      contentMutationObserver.disconnect();
      dialog.removeEventListener('transitionend', handleTransitionEnd);
      window.removeEventListener('resize', updateHeight);
      delete dialog.dataset.sizeReady;
      delete dialog.dataset.sizeScrollable;
      delete dialog.dataset.sizeAnimating;
      dialog.style.removeProperty('height');
    };
  }, [dialogRef, contentRef]);
};
