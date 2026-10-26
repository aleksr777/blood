import { WarningNotice } from '../warning-notice/warning-notice';
import { formatComponentUnitNumber } from './component-unit-number';
import { DonorFields } from './donor-fields';
import { ProtocolFieldControl } from './protocol-field-control';
import { getHemaconExpirationWarning } from './reagent-defaults';
import { getHemaconDateOrderWarning } from '../../domain/hemacon-dates';
import type { ProtocolFieldConfig, ProtocolValues } from './protocol-types';
import styles from './protocol-editor.module.css';

type Props = {
  fields: ProtocolFieldConfig[];
  values: ProtocolValues;
  onChange: (values: ProtocolValues) => void;
  savedDocument: boolean;
  componentUnitNumberWarning: string;
  onDismissComponentUnitNumberWarning: () => void;
};

export const DonorDetailsFields = ({
  fields,
  values,
  onChange,
  savedDocument,
  componentUnitNumberWarning,
  onDismissComponentUnitNumberWarning,
}: Props) => {
  const expirationWarning = savedDocument ? '' : getHemaconExpirationWarning(values.expirationDate);
  const dateOrderWarning = getHemaconDateOrderWarning(values);
  const renderField = (field: ProtocolFieldConfig) => (
    <ProtocolFieldControl
      key={field.name}
      field={field}
      savedDocument={savedDocument}
      value={values[field.name] ?? ''}
      onChange={(name, value) => onChange({ [name]: value })}
    />
  );

  return (
    <>
      <DonorFields values={values} onChange={onChange} showComponentSelector={false} />
      {fields
        .filter(({ name }) => name === 'componentUnitNumber')
        .map((field) => (
          <div key={field.name} className={styles.componentUnitNumberField}>
            <label>
              <span>{field.label}</span>
              <input
                name={field.name}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={16}
                value={formatComponentUnitNumber(values[field.name])}
                onChange={(event) =>
                  onChange({ [field.name]: formatComponentUnitNumber(event.target.value) })
                }
              />
            </label>
            <WarningNotice
              className={styles.fieldWarning}
              message={componentUnitNumberWarning}
              onDismiss={onDismissComponentUnitNumberWarning}
            />
          </div>
        ))}
      {['amountMl', 'collectionDate', 'expirationDate', 'collectionOrganization'].flatMap(
        (name) => {
          const field = fields.find((field) => field.name === name);
          if (!field) return [];
          return name === 'expirationDate' ? (
            <div key={name} className={styles.componentUnitNumberField}>
              {renderField(field)}
              <WarningNotice
                className={styles.fieldWarning}
                message={dateOrderWarning}
                dismissible={false}
              />
              <WarningNotice
                className={styles.fieldWarning}
                message={expirationWarning ? `${expirationWarning}.` : ''}
              />
            </div>
          ) : (
            renderField(field)
          );
        },
      )}
    </>
  );
};
