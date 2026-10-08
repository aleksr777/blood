import { useEffect } from 'react';

const STORAGE_PREFIX = 'blood:textarea-height:';

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
  const dialog = textarea.closest<HTMLElement>('[role="dialog"]');
  const dialogTitle = dialog?.querySelector('h1, h2, h3')?.textContent?.trim();

  if (labelText || dialogTitle) {
    return `${STORAGE_PREFIX}${normalizeKeyPart(
      [dialogTitle, labelText].filter(Boolean).join(':'),
    )}`;
  }

  const textareas = Array.from(document.querySelectorAll('textarea'));
  return `${STORAGE_PREFIX}fallback:${textareas.indexOf(textarea)}`;
};

const restoreHeight = (textarea: HTMLTextAreaElement) => {
  try {
    const storedHeight = window.localStorage.getItem(getTextareaKey(textarea));
    if (!storedHeight) return;

    const height = Number.parseFloat(storedHeight);
    if (Number.isFinite(height) && height > 0) {
      textarea.style.height = `${height}px`;
    }
  } catch {
    // Local storage can be unavailable in restricted browser modes.
  }
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

export const usePersistedTextareaSizes = () => {
  useEffect(() => {
    const restoreInNode = (node: ParentNode) => {
      if (node instanceof HTMLTextAreaElement) restoreHeight(node);
      node.querySelectorAll?.('textarea').forEach((textarea) => restoreHeight(textarea));
    };

    restoreInNode(document);

    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) restoreInNode(node);
        });
      });
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    const saveVisibleTextareaHeights = () => {
      document.querySelectorAll<HTMLTextAreaElement>('textarea').forEach((textarea) => {
        if (textarea.isConnected) saveHeight(textarea);
      });
    };

    document.addEventListener('pointerup', saveVisibleTextareaHeights, true);
    document.addEventListener('pointerdown', saveVisibleTextareaHeights, true);
    window.addEventListener('beforeunload', saveVisibleTextareaHeights);

    return () => {
      saveVisibleTextareaHeights();
      mutationObserver.disconnect();
      document.removeEventListener('pointerup', saveVisibleTextareaHeights, true);
      document.removeEventListener('pointerdown', saveVisibleTextareaHeights, true);
      window.removeEventListener('beforeunload', saveVisibleTextareaHeights);
    };
  }, []);
};
