import { FormInput, FormTextarea } from '../form-input/form-input';
import { CustomSelectField } from './custom-select-field';
import { DepartmentField } from './department-field';
import { formatRecipientAge } from './recipient-demographics';
import { RecipientField } from './recipient-field';
import type { RecipientRecord } from '../../storage/repositories/recipients';
import type { ProtocolValues } from './protocol-types';
import styles from './patient-details-fields.module.css';
type Props = {
  values: ProtocolValues;
  onChange: (values: ProtocolValues) => void;
  savedDocument?: boolean;
  archivedAge?: string;
  ageReferenceDate?: string;
  nameLabel?: string;
  onOpenRecipients?: () => void;
  onSelectRecipient?: (recipient: RecipientRecord) => void | boolean | Promise<void | boolean>;
};

export const PatientDetailsFields = ({
  values,
  onChange,
  savedDocument = false,
  archivedAge = '',
  ageReferenceDate,
  nameLabel = 'Фамилия, имя, отчество реципиента',
  onOpenRecipients,
  onSelectRecipient,
}: Props) => {
  const change = (name: string, value: string) => onChange({ [name]: value });
  const age = savedDocument
    ? archivedAge || values.recipientAge
    : formatRecipientAge(values.recipientBirthDate, ageReferenceDate);
  const canSelectRecipient = !savedDocument && onOpenRecipients && onSelectRecipient;
  return (
    <fieldset className={styles.group}>
      <legend>Данные реципиента</legend>
      <div className={styles.grid}>
        {canSelectRecipient ? (
          <div className={styles.name}>
            <div className={styles.fieldLabel}>{nameLabel}</div>
            <RecipientField
              value={values.recipientName ?? ''}
              recipientId={values.recipientId}
              onChange={(value) => change('recipientName', value)}
              onOpenRecipients={onOpenRecipients}
              onSelectRecipient={onSelectRecipient}
            />
          </div>
        ) : (
          <label className={styles.name}>
            <span>{nameLabel}</span>
            <FormInput
              name="recipientName"
              value={values.recipientName ?? ''}
              readOnly={savedDocument}
              onChange={(event) => change('recipientName', event.target.value)}
            />
          </label>
        )}
        <label>
          <span>Дата рождения</span>
          <FormInput
            name="recipientBirthDate"
            type="date"
            value={values.recipientBirthDate ?? ''}
            readOnly={savedDocument}
            onChange={(event) => change('recipientBirthDate', event.target.value)}
          />
        </label>
        <div>
          <div className={styles.fieldLabel}>Возраст</div>
          <div className={styles.calculatedValue}>{age || '—'}</div>
        </div>
        <div className={styles.sex}>
          <div className={styles.fieldLabel}>Пол</div>
          <CustomSelectField
            name="recipientSex"
            label="Пол"
            options={['Мужской', 'Женский']}
            value={values.recipientSex ?? ''}
            emptyLabel="Не указано"
            onChange={(value) => change('recipientSex', value)}
          />
        </div>
        <div className={styles.details}>
          <label>
            <span>№ медицинской карты</span>
            <FormInput
              name="medicalRecordNumber"
              value={values.medicalRecordNumber ?? ''}
              readOnly={savedDocument}
              onChange={(event) => change('medicalRecordNumber', event.target.value)}
            />
          </label>
          <div>
            <div className={styles.fieldLabel}>Отделение</div>
            <DepartmentField
              value={values.department ?? ''}
              onChange={(value) => change('department', value)}
            />
          </div>
        </div>
        <label className={styles.diagnosis}>
          <span>Диагноз</span>
          <FormTextarea
            name="diagnosis"
            value={values.diagnosis ?? ''}
            onChange={(event) => change('diagnosis', event.target.value)}
          />
        </label>
      </div>
    </fieldset>
  );
};
