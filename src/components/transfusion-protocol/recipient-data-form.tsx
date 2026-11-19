import type { PropsWithChildren } from 'react';
import { AnimatedMessage } from '../animated-reveal/animated-message';
import { ModalDismissButton } from '../modal/modal';
import { PatientDetailsFields } from './patient-details-fields';
import { RecipientExaminationFields } from './recipient-examination-fields';
import { RecipientHistoryFields } from './recipient-history-fields';
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
        <div className={styles.wide}>
          <RecipientExaminationFields values={values} onChange={onChange} />
        </div>
        <div className={styles.wide}>
          <RecipientHistoryFields values={values} onChange={onChange} />
        </div>
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
