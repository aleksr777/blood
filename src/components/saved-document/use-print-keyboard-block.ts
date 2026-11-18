import { useEffect } from 'react';

export const usePrintKeyboardBlock = () => {
  useEffect(() => {
    const blockPrintKeys = (event: KeyboardEvent) => {
      const shortcut =
        (event.ctrlKey || event.metaKey) &&
        (event.code === 'KeyP' || event.key.toLowerCase() === 'p');
      const printButton = event.target instanceof Element && event.target.closest('.print-button');
      if (shortcut || (printButton && (event.key === 'Enter' || event.key === ' '))) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener('keydown', blockPrintKeys, true);
    return () => window.removeEventListener('keydown', blockPrintKeys, true);
  }, []);
};
