import { CustomSelectField } from './custom-select-field';
import { DepartmentField } from './department-field';
import { getSavedOptionCategory, isSharedSavedOptionCategory } from './saved-field-config';
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

const BasicControl = ({ field, value, onChange }: Pick<Props, 'field' | 'value' | 'onChange'>) => {
  if (field.type === 'textarea') {
    return (
      <textarea
        name={field.name}
        value={value}
        rows={4}
        onChange={(event) => onChange(field.name, event.target.value)}
      />
    );
  }

  return (
    <input
      name={field.name}
      type={field.type ?? 'text'}
      step={field.step}
      value={value}
      readOnly={field.readOnly}
      onChange={(event) => onChange(field.name, event.target.value)}
    />
  );
};

export const ProtocolFieldControl = ({
  savedDocument = false,
  field,
  value,
  onChange,
  onOpenRecipients,
  onSelectRecipient,
}: Props) => {
  const className = field.wide ? styles.wide : undefined;
  const change = (nextValue: string, previousOptionValue?: string) =>
    onChange(field.name, nextValue, previousOptionValue);

  if (field.name === 'recipientName') {
    if (savedDocument) {
      return (
        <label className={className}>
          <span>{field.label}</span>
          <input name={field.name} value={value} onChange={(event) => change(event.target.value)} />
        </label>
      );
    }
    return (
      <div className={className}>
        <div className={styles.fieldLabel}>{field.label}</div>
        <RecipientField
          value={value}
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
          rememberOnBlur={isSharedSavedOptionCategory(category)}
          value={value}
          onChange={change}
        />
      </div>
    );
  }

  return (
    <label className={className}>
      <span>{field.label}</span>
      <BasicControl field={field} value={value} onChange={onChange} />
    </label>
  );
};
