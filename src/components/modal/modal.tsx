import {
  createContext,
  useContext,
  type ComponentPropsWithoutRef,
  type PropsWithChildren,
} from 'react';
import { createPortal } from 'react-dom';
import styles from './modal.module.css';
import { useModalBehavior } from './use-modal-behavior';

const ModalCloseContext = createContext<(() => void) | null>(null);

export const ModalDismissButton = ({ onClick, ...props }: ComponentPropsWithoutRef<'button'>) => {
  const requestClose = useContext(ModalCloseContext);
  return (
    <button
      type="button"
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) requestClose?.();
      }}
    />
  );
};

const Modal = ({
  title,
  onClose,
  children,
  className = '',
  dismissible = true,
}: PropsWithChildren<{
  title: string;
  onClose: () => void;
  className?: string;
  dismissible?: boolean;
}>) => {
  const { ref, label, state, requestClose, requestPointerClose } = useModalBehavior(
    onClose,
    dismissible,
  );

  return createPortal(
    <dialog
      ref={ref}
      className={[styles.modal, className].filter(Boolean).join(' ')}
      data-state={state}
      aria-labelledby={label}
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) requestPointerClose();
      }}
    >
      <ModalCloseContext.Provider value={requestClose}>
        <div className={styles.content}>
          <button
            type="button"
            className={styles.close}
            aria-label="Close modal"
            disabled={!dismissible}
            onClick={requestPointerClose}
          >
            ×
          </button>
          <h2 className={styles.title} id={label}>
            {title}
          </h2>
          {children}
        </div>
      </ModalCloseContext.Provider>
    </dialog>,
    document.body,
  );
};

export default Modal;
