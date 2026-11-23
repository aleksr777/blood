import { FormInput } from '../form-input/form-input';
import { DateTimeInputs } from '../form-input/date-time-inputs';
import { isSavedRecipientIdentityField } from '../../domain/saved-recipient-identity';
import { ProtocolBasicControl } from './protocol-basic-control';
import { useSavedDocumentScope } from '../saved-document/saved-document-scope';
import { CustomSelectField } from './custom-select-field';
import { DepartmentField } from './department-field';
import { getSavedOptionCategory } from './saved-field-config';
import { RecipientField } from './recipient-field';
import { SavedOptionsField } from './saved-options-field';
import styles from './protocol-editor.module.css';
import type { RecipientRecord } from '../../storage/repositories/recipients';
import type { ProtocolFieldConfig } from './protocol-types';

type Props = {
  savedDocument?: boolean;
  field: ProtocolFieldConfig;
  value: string;
  onChange: (name: string, value: string, previousOptionValue?: string) => void;
  onOpenRecipients?: () => void;
  onSelectRecipient?: (recipient: RecipientRecord) => void | boolean | Promise<void | boolean>;
};

export const ProtocolFieldControl = ({
  savedDocument = false,
  field,
  value,
  onChange,
  onOpenRecipients,
  onSelectRecipient,
}: Props) => {
  const isolated = useSavedDocumentScope();
  const className = field.wide ? styles.wide : undefined;
  const change = (nextValue: string, previousOptionValue?: string) =>
    onChange(field.name, nextValue, previousOptionValue);

  if (field.type === 'datetime-local') {
    return (
      <div className={styles.wide}>
        <DateTimeInputs
          name={field.name}
          label={field.label}
          value={value}
          readOnly={field.readOnly}
          onChange={change}
        />
      </div>
    );
  }

  if ((savedDocument || isolated) && isSavedRecipientIdentityField(field.name)) {
    return (
      <label className={className}>
        <span>{field.label}</span>
        <FormInput
          name={field.name}
          type={field.type === 'date' ? 'date' : 'text'}
          value={value}
          readOnly
        />
      </label>
    );
  }

  if (field.name === 'recipientName') {
    return (
      <div className={className}>
        <div className={styles.fieldLabel}>{field.label}</div>
        <RecipientField
          value={value}
          onChange={change}
          onSelectRecipient={onSelectRecipient ?? (() => undefined)}
          onOpenRecipients={onOpenRecipients ?? (() => undefined)}
        />
      </div>
    );
  }

  if (field.name === 'department') {
    return (
      <div className={className}>
        <div className={styles.fieldLabel}>{field.label}</div>
        <DepartmentField value={value} onChange={change} />
      </div>
    );
  }

  if (field.type === 'select') {
    return (
      <div className={className}>
        <div className={styles.fieldLabel}>{field.label}</div>
        <CustomSelectField
          name={field.name}
          label={field.label}
          options={field.options ?? []}
          value={value}
          onChange={change}
          allowEmpty={!field.required}
        />
      </div>
    );
  }

  const category = getSavedOptionCategory(field.name);
  if (category) {
    return (
      <div className={className}>
        <div className={styles.fieldLabel}>{field.label}</div>
        <SavedOptionsField
          name={field.name}
          label={field.label}
          category={category}
          value={value}
          onChange={change}
        />
      </div>
    );
  }

  return (
    <label className={className}>
      <span>{field.label}</span>
      <ProtocolBasicControl field={field} value={value} onChange={onChange} />
    </label>
  );
};
