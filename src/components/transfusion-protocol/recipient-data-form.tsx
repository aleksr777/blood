import type { PropsWithChildren } from 'react';
import { AnimatedMessage } from '../animated-reveal/animated-message';
import { ModalDismissButton } from '../modal/modal';
import { formatRecipientAge } from './recipient-demographics';
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
  const change = (name: string, value: string) => onChange({ [name]: value });
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (!busy) onSubmit();
      }}
    >
      <fieldset className={styles.grid} disabled={busy}>
        <label className={styles.wide}>
          <span>Фамилия, имя, отчество</span>
          <input
            name="recipientName"
            value={values.recipientName ?? ''}
            onChange={(event) => change('recipientName', event.target.value)}
          />
        </label>
        <label>
          <span>Дата рождения</span>
          <input
            name="recipientBirthDate"
            type="date"
            value={values.recipientBirthDate ?? ''}
            onChange={(event) => change('recipientBirthDate', event.target.value)}
          />
        </label>
        <label>
          <span>Пол</span>
          <select
            name="recipientSex"
            value={values.recipientSex ?? ''}
            onChange={(event) => change('recipientSex', event.target.value)}
          >
            <option value="">Не указано</option>
            <option value="Мужской">Мужской</option>
            <option value="Женский">Женский</option>
          </select>
        </label>
        <label>
          <span>Возраст</span>
          <input type="text" value={formatRecipientAge(values.recipientBirthDate)} readOnly />
        </label>
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
