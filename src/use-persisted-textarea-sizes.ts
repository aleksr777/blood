import { useEffect } from 'react';

const STORAGE_PREFIX = 'blood:textarea-height:';
const MODAL_RESIZE_SAFETY_PX = 8;
const MODAL_SIZE_TRANSITION_MS = 220;
const TEXTAREA_REVEAL_DELAY_MS = MODAL_SIZE_TRANSITION_MS + 15;

const normalizeKeyPart = (value: string) =>
  value.trim().replace(/\s+/g, ' ').slice(0, 160);

const getTextareaKey = (textarea: HTMLTextAreaElement) => {
  const explicitKey =
    textarea.dataset.resizeKey ||
    textarea.name ||
    textarea.id ||
    textarea.getAttribute('aria-label');

  if (explicitKey) return `${STORAGE_PREFIX}${normalizeKeyPart(explicitKey)}`;

  const label = textarea.closest('label');
  const labelText = label?.querySelector('span')?.textContent?.trim();
  const dialog = textarea.closest('dialog');
  const dialogTitle = dialog?.querySelector('h1, h2, h3')?.textContent?.trim();

  if (labelText || dialogTitle) {
    return `${STORAGE_PREFIX}${normalizeKeyPart(
      [dialogTitle, labelText].filter(Boolean).join(':'),
    )}`;
  }

  const textareas = Array.from(document.querySelectorAll('textarea'));
  return `${STORAGE_PREFIX}fallback:${textareas.indexOf(textarea)}`;
};

const getModalMaximumTextareaHeight = (textarea: HTMLTextAreaElement) => {
  const dialog = textarea.closest<HTMLDialogElement>('dialog');
  const textareaRect = textarea.getBoundingClientRect();

  if (!dialog) {
    return Math.max(
      textareaRect.height,
      window.innerHeight - textareaRect.top - MODAL_RESIZE_SAFETY_PX,
    );
  }

  const dialogRect = dialog.getBoundingClientRect();
  const dialogStyle = window.getComputedStyle(dialog);
  const computedMaxHeight = Number.parseFloat(dialogStyle.maxHeight);
  const maxDialogHeight = Number.isFinite(computedMaxHeight)
    ? computedMaxHeight
    : window.innerHeight;

  const remainingDialogGrowth = Math.max(0, maxDialogHeight - dialogRect.height);

  return Math.max(
    textareaRect.height,
    textareaRect.height + remainingDialogGrowth - MODAL_RESIZE_SAFETY_PX,
  );
};

const constrainHeight = (textarea: HTMLTextAreaElement) => {
  if (!textarea.isConnected) return;

  const maximumHeight = getModalMaximumTextareaHeight(textarea);
  textarea.style.setProperty('max-height', `${maximumHeight}px`, 'important');

  const currentHeight = textarea.getBoundingClientRect().height;
  if (currentHeight > maximumHeight) {
    textarea.style.height = `${maximumHeight}px`;
  }
};

const restoreHeight = (textarea: HTMLTextAreaElement) => {
  try {
    const storedHeight = window.localStorage.getItem(getTextareaKey(textarea));
    if (storedHeight) {
      const height = Number.parseFloat(storedHeight);
      if (Number.isFinite(height) && height > 0) {
        textarea.style.height = `${height}px`;
      }
    }
  } catch {
    // Local storage can be unavailable in restricted browser modes.
  }

  requestAnimationFrame(() => constrainHeight(textarea));
};

const saveHeight = (textarea: HTMLTextAreaElement) => {
  try {
    window.localStorage.setItem(
      getTextareaKey(textarea),
      String(textarea.getBoundingClientRect().height),
    );
  } catch {
    // Keep textarea resizing functional even when persistence is unavailable.
  }
};

const forEachTextarea = (node: ParentNode, callback: (textarea: HTMLTextAreaElement) => void) => {
  if (node instanceof HTMLTextAreaElement) callback(node);
  node.querySelectorAll?.('textarea').forEach((textarea) => callback(textarea));
};

export const usePersistedTextareaSizes = () => {
  useEffect(() => {
    const revealTimers = new Set<number>();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const stageTextareaAfterModal = (textarea: HTMLTextAreaElement) => {
      if (reducedMotion) return;

      const dialog = textarea.closest<HTMLDialogElement>('dialog');
      if (!dialog || dialog.dataset.sizeReady !== 'true') return;

      textarea.dataset.modalResizeStage = 'true';

      const timer = window.setTimeout(() => {
        revealTimers.delete(timer);
        delete textarea.dataset.modalResizeStage;
      }, TEXTAREA_REVEAL_DELAY_MS);

      revealTimers.add(timer);
    };

    const restoreInNode = (node: ParentNode, stageAfterModal = false) => {
      forEachTextarea(node, (textarea) => {
        restoreHeight(textarea);
        if (stageAfterModal) stageTextareaAfterModal(textarea);
      });
    };

    restoreInNode(document);

    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.removedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            forEachTextarea(node, saveHeight);
          }
        });

        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            restoreInNode(node, true);
          }
        });
      });
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    const saveVisibleTextareaHeights = () => {
      document.querySelectorAll<HTMLTextAreaElement>('textarea').forEach((textarea) => {
        if (textarea.isConnected) saveHeight(textarea);
      });
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof HTMLTextAreaElement) {
        constrainHeight(event.target);
      }
      saveVisibleTextareaHeights();
    };

    const handlePointerUp = () => {
      saveVisibleTextareaHeights();
    };

    const updateTextareaLimits = () => {
      document.querySelectorAll<HTMLTextAreaElement>('textarea').forEach(constrainHeight);
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('pointerup', handlePointerUp, true);
    window.addEventListener('resize', updateTextareaLimits);
    window.addEventListener('beforeunload', saveVisibleTextareaHeights);

    return () => {
      saveVisibleTextareaHeights();
      revealTimers.forEach((timer) => window.clearTimeout(timer));
      revealTimers.clear();
      mutationObserver.disconnect();
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('pointerup', handlePointerUp, true);
      window.removeEventListener('resize', updateTextareaLimits);
      window.removeEventListener('beforeunload', saveVisibleTextareaHeights);
    };
  }, []);
};
