import { useEffect, type RefObject } from 'react';

const SIZE_TOLERANCE_PX = 0.5;
const SIZE_TRANSITION_FALLBACK_MS = 260;

const parsePixels = (value: string) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getAddedElements = (node: Node) => {
  if (!(node instanceof HTMLElement)) return [];

  // Fade the highest newly-added node only. Its descendants remain hidden with it
  // and participate in layout, so the modal can measure the final height first.
  return [node];
};

export const useModalAutoHeight = (
  dialogRef: RefObject<HTMLDialogElement | null>,
  contentRef: RefObject<HTMLDivElement | null>,
) => {
  useEffect(() => {
    const dialog = dialogRef.current;
    const content = contentRef.current;
    if (!dialog || !content) return undefined;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let measureFrame: number | null = null;
    let readyFrame: number | null = null;
    let settleTimer: number | null = null;
    let revealFrame: number | null = null;
    let initialized = false;
    let previousHeight: number | null = null;

    const revealEnteringContent = () => {
      if (revealFrame !== null) {
        window.cancelAnimationFrame(revealFrame);
      }

      revealFrame = window.requestAnimationFrame(() => {
        revealFrame = null;
        content
          .querySelectorAll<HTMLElement>('[data-modal-content-entering]')
          .forEach((element) => {
            delete element.dataset.modalContentEntering;
          });
        delete dialog.dataset.sizeAnimating;
      });

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
        revealEnteringContent,
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
        const hasEnteringContent = Boolean(
          content.querySelector('[data-modal-content-entering]'),
        );

        dialog.dataset.sizeScrollable = String(
          naturalHeight > maximumHeight + SIZE_TOLERANCE_PX,
        );

        if (initialized && heightChanged && hasEnteringContent && !reducedMotion) {
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
        } else if (hasEnteringContent && (!heightChanged || reducedMotion)) {
          revealEnteringContent();
        }
      });
    };

    const contentMutationObserver = new MutationObserver((mutations) => {
      if (!initialized) return;

      let hasNewContent = false;

      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          getAddedElements(node).forEach((element) => {
            // Ignore nodes already covered by a newly-added hidden ancestor.
            if (element.parentElement?.closest('[data-modal-content-entering]')) return;
            element.dataset.modalContentEntering = 'true';
            hasNewContent = true;
          });
        });
      });

      if (hasNewContent) updateHeight();
    });

    const handleTransitionEnd = (event: TransitionEvent) => {
      if (event.target !== dialog || event.propertyName !== 'height') return;
      revealEnteringContent();
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
      if (revealFrame !== null) {
        window.cancelAnimationFrame(revealFrame);
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
