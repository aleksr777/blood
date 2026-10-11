import { useState } from 'react';
import { CustomSelectField } from './custom-select-field';
import { DONOR_ANTIGENS } from './donor-model';
import { INDICATION_COMPONENTS } from './indications-model';
import type { ProtocolValues } from './protocol-types';
import { useOverlayDropdown } from './use-overlay-dropdown';
import componentStyles from './indications-fields.module.css';
import editorStyles from './protocol-editor.module.css';
import styles from './recipient-examination-fields.module.css';

type Props = {
  values: ProtocolValues;
  onChange: (values: ProtocolValues) => void;
};

const COMPONENT_NAME_OPTIONS: Record<string, string[]> = {
  erythrocytes: [
    'Эритроцитная взвесь с удалённым лейкотромбоцитным слоем',
    'Эритроцитная взвесь лейкоредуцированная',
  ],
  'plasma-cryo': ['Свежезамороженная плазма'],
  platelets: [],
};

const SelectField = ({
  name,
  label,
  options,
  value,
  onChange,
  emptyLabel,
  emptyDisplayLabel,
  compact = false,
}: {
  name: string;
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  emptyLabel?: string;
  emptyDisplayLabel?: string;
  compact?: boolean;
}) => (
  <div className={styles.selectField}>
    <div className={styles.label}>{label}</div>
    <CustomSelectField
      name={name}
      label={label}
      options={options}
      value={value}
      emptyLabel={emptyLabel}
      emptyDisplayLabel={emptyDisplayLabel}
      compact={compact}
      onChange={onChange}
    />
  </div>
);

const ComponentNameInput = ({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const { rootRef, dropdownState } = useOverlayDropdown(open, setOpen);
  const hasOptions = options.length > 0;

  return (
    <div ref={rootRef} className={editorStyles.departmentField}>
      <div className={editorStyles.departmentControl}>
        <input
          name="componentName"
          type="text"
          autoComplete="off"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        {hasOptions && (
          <button
            type="button"
            className={editorStyles.historyToggle}
            aria-label="Показать варианты наименования компонента"
            aria-expanded={open}
            onClick={() => setOpen((current) => !current)}
          >
            ▾
          </button>
        )}
      </div>

      {hasOptions && (
        <div
          className={editorStyles.historyDropdown}
          data-state={dropdownState}
          role="listbox"
          aria-label="Варианты наименования компонента"
          aria-hidden={dropdownState !== 'open'}
        >
          {options.map((option) => (
            <button
              key={option}
              type="button"
              className={editorStyles.customSelectOption}
              role="option"
              aria-selected={value === option}
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
            >
              <span>{option}</span>
              {value === option && <span aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const DonorFields = ({ values, onChange }: Props) => {
  const legacyComponent = INDICATION_COMPONENTS.find(
    ({ label }) => label === values.componentName,
  );
  const selectedComponent = values.componentGroup || legacyComponent?.value || '';
  const componentName =
    legacyComponent && values.componentName === legacyComponent.label
      ? ''
      : values.componentName ?? '';
  const componentNameOptions = COMPONENT_NAME_OPTIONS[selectedComponent] ?? [];

  return (
    <div className={styles.root}>
      <fieldset className={componentStyles.componentGroup}>
        <legend>Компонент крови</legend>
        <div className={componentStyles.componentChoices}>
          {INDICATION_COMPONENTS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              className={componentStyles.componentButton}
              data-component={value}
              data-selected={selectedComponent === value}
              aria-pressed={selectedComponent === value}
              onClick={() =>
                onChange({
                  componentGroup: value,
                  indicationComponent: value,
                  ...(selectedComponent !== value ? { componentName: '' } : {}),
                })
              }
            >
              {label}
            </button>
          ))}
        </div>

        {selectedComponent && (
          <div className={componentStyles.componentNameField}>
            <div className={editorStyles.fieldLabel}>
              Точное наименование компонента донорской крови
            </div>
            <ComponentNameInput
              value={componentName}
              options={componentNameOptions}
              onChange={(nextValue) =>
                onChange({
                  componentGroup: selectedComponent,
                  componentName: nextValue,
                })
              }
            />
          </div>
        )}
      </fieldset>

      <div className={styles.topGrid}>
        <SelectField
          name="donorAbo"
          label="Группа крови AB0"
          options={['O(I)', 'A(II)', 'B(III)', 'AB(IV)']}
          value={values.donorAbo ?? ''}
          onChange={(value) => onChange({ donorAbo: value })}
        />
        <SelectField
          name="donorRh"
          label="Резус-принадлежность"
          options={['Rh(D)+', 'Rh(D)-']}
          value={values.donorRh ?? ''}
          onChange={(value) => onChange({ donorRh: value })}
        />
      </div>

      <div className={styles.groupTitle}>Антигены:</div>
      <div className={styles.antigenGrid}>
        {DONOR_ANTIGENS.map(({ name, label }) => (
          <SelectField
            key={name}
            name={name}
            label={label}
            options={['+', '-']}
            value={values[name] ?? ''}
            emptyLabel=""
            emptyDisplayLabel=""
            compact
            onChange={(value) => onChange({ [name]: value, donorAntigens: '' })}
          />
        ))}
      </div>
    </div>
  );
};
