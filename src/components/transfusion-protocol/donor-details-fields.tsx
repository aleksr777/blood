import { FormInput } from '../form-input/form-input';
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
  const dateOrderWarning = getHemaconDateOrderWarning(values);
  const expirationWarning =
    savedDocument || dateOrderWarning ? '' : getHemaconExpirationWarning(values.expirationDate);
  const renderField = (field: ProtocolFieldConfig) => (
    <ProtocolFieldControl
      key={field.name}
      field={field}
      savedDocument={savedDocument}
      value={values[field.name] ?? ''}
      onChange={(name, value) => onChange({ [name]: value })}
    />
  );
  const renderNamedField = (name: string) => {
    const field = fields.find((field) => field.name === name);
    return field ? renderField(field) : null;
  };

  return (
    <>
      <DonorFields values={values} onChange={onChange} showComponentSelector={false} />
      {fields
        .filter(({ name }) => name === 'componentUnitNumber')
        .map((field) => (
          <div key={field.name} className={styles.componentUnitNumberField}>
            <label>
              <span>{field.label}</span>
              <FormInput
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
      {renderNamedField('amountMl')}
      <div className={styles.wide} role="group" aria-label="Даты гемакона">
        <div className={styles.grid}>
          {renderNamedField('collectionDate')}
          {renderNamedField('expirationDate')}
        </div>
        <WarningNotice
          className={styles.fieldWarning}
          message={dateOrderWarning || (expirationWarning ? `${expirationWarning}.` : '')}
          dismissible={!dateOrderWarning}
        />
      </div>
      {renderNamedField('collectionOrganization')}
    </>
  );
};
