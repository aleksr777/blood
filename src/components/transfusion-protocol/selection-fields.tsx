import { ProtocolFieldControl } from './protocol-field-control';
import { getSelectionStatus, SELECTION_STATUS } from './selection-model';
import type { ProtocolFieldConfig, ProtocolValues } from './protocol-types';
import styles from './selection-fields.module.css';

type Props = {
  values: ProtocolValues;
  onChange: (values: ProtocolValues) => void;
};

const DETAIL_FIELDS: ProtocolFieldConfig[] = [
  {
    name: 'selectionOrganization',
    label: 'Медицинская организация, осуществившая индивидуальный подбор',
    wide: true,
  },
  { name: 'selectionDate', label: 'Дата исследования', type: 'date' },
  {
    name: 'responsiblePerson',
    label: 'Фамилия, имя, отчество ответственного лица',
    wide: true,
  },
  {
    name: 'compatibilityConclusion',
    label: 'Заключение',
    type: 'select',
    options: ['Совместимо', 'Несовместимо'],
  },
];

export const SelectionFields = ({ values, onChange }: Props) => {
  const status = getSelectionStatus(values);
  const changeValue = (name: string, value: string) => onChange({ [name]: value });

  return (
    <div className={styles.root}>
      <fieldset className={styles.statusGroup}>
        <legend>Индивидуальный подбор</legend>
        <div className={styles.options}>
          <label className={styles.option}>
            <input
              type="radio"
              name="selectionStatus"
              checked={status === SELECTION_STATUS.notPerformed}
              onChange={() => onChange({ selectionStatus: SELECTION_STATUS.notPerformed })}
            />
            <span>Не проводился</span>
          </label>
          <label className={styles.option}>
            <input
              type="radio"
              name="selectionStatus"
              checked={status === SELECTION_STATUS.performed}
              onChange={() => onChange({ selectionStatus: SELECTION_STATUS.performed })}
            />
            <span>Проводился</span>
          </label>
        </div>
      </fieldset>

      {status === SELECTION_STATUS.performed && (
        <div className={styles.details}>
          {DETAIL_FIELDS.map((field) => (
            <ProtocolFieldControl
              key={field.name}
              field={field}
              value={values[field.name] ?? ''}
              onChange={changeValue}
              onValuesChange={onChange}
            />
          ))}
        </div>
      )}
    </div>
  );
};
