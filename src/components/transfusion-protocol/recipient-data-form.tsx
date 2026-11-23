import type { PropsWithChildren } from 'react';
import { AnimatedMessage } from '../animated-reveal/animated-message';
import { ModalDismissButton } from '../modal/modal';
import { PatientDetailsFields } from './patient-details-fields';
import { RecipientExaminationSection, RecipientHistorySection } from './recipient-input-sections';
import type { ProtocolValues } from './protocol-types';
import styles from './recipient-edit-modal.module.css';

type Props = PropsWithChildren<{
  values: ProtocolValues;
  onChange: (values: ProtocolValues) => void;
  onSubmit: () => void;
  busy: boolean;
  error: string;
  submitLabel: string;
  pendingLabel: string;
}>;

export const RecipientDataForm = ({
  values,
  onChange,
  onSubmit,
  busy,
  error,
  submitLabel,
  pendingLabel,
  children,
}: Props) => {
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (!busy) onSubmit();
      }}
    >
      <fieldset className={styles.grid} disabled={busy}>
        <PatientDetailsFields
          values={values}
          onChange={onChange}
          nameLabel="Фамилия, имя, отчество"
        />
        <RecipientExaminationSection values={values} onChange={onChange} />
        <RecipientHistorySection values={values} onChange={onChange} />
      </fieldset>
      {children}
      <AnimatedMessage message={error} className={styles.error} role="alert" />
      <div className={styles.actions}>
        <ModalDismissButton className={styles.secondary} disabled={busy}>
          Отмена
        </ModalDismissButton>
        <button type="submit" className={styles.primary} disabled={busy}>
          {busy ? pendingLabel : submitLabel}
        </button>
      </div>
    </form>
  );
};
