export const installPrintKeyboardGuard = () => {
  const onKeyDown = (event: KeyboardEvent) => {
    const printShortcut =
      (event.ctrlKey || event.metaKey) &&
      (event.code === 'KeyP' || event.key.toLowerCase() === 'p');
    const printButton = event.target instanceof Element && event.target.closest('.print-button');
    const activateButton = printButton && (event.key === 'Enter' || event.key === ' ');
    if (printShortcut || activateButton) {
      event.preventDefault();
      event.stopPropagation();
    }
  };
  const onClick = (event: MouseEvent) => {
    if (
      event.isTrusted &&
      event.detail === 0 &&
      event.target instanceof Element &&
      event.target.closest('.print-button')
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  };
  window.addEventListener('keydown', onKeyDown, true);
  window.addEventListener('click', onClick, true);
  return () => {
    window.removeEventListener('keydown', onKeyDown, true);
    window.removeEventListener('click', onClick, true);
  };
};
