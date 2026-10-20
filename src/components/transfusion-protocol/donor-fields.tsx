import { useEffect, useState } from 'react';
import {
  ABO_OPTIONS,
  ANTIGEN_OPTIONS,
  BloodGroupSelectField,
  getBloodGroupTone,
  normalizeBloodGroupRh,
  RH_OPTIONS,
} from './blood-group-select-field';
import { DONOR_ANTIGENS } from './donor-model';
import { INDICATION_COMPONENTS } from './indications-model';
import {
  loadSavedOptions,
  rememberSavedOption,
  removeSavedOption,
  renameSavedOption,
  type SavedOptionRecord,
} from '../../storage/repositories/saved-options';
import { SavedOptionItem } from './saved-option-item';
import { getComponentNameOptionCategory } from './saved-field-config';
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
  const donorRh = normalizeBloodGroupRh(values.donorRh);
  const bloodGroupTone = getBloodGroupTone(donorRh);

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
              fixedOptions={componentNameOptions}
              componentGroup={selectedComponent}
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
        <BloodGroupSelectField
          name="donorAbo"
          label="Группа крови AB0"
          options={ABO_OPTIONS}
          value={values.donorAbo ?? ''}
          tone={bloodGroupTone}
          onChange={(value) => onChange({ donorAbo: value })}
        />
        <BloodGroupSelectField
          name="donorRh"
          label="Резус-принадлежность"
          options={RH_OPTIONS}
          value={donorRh}
          tone={bloodGroupTone}
          onChange={(value) => onChange({ donorRh: value })}
        />
      </div>

      <div className={styles.groupTitle}>Антигены:</div>
      <div className={styles.antigenGrid}>
        {DONOR_ANTIGENS.map(({ name, label }) => (
          <BloodGroupSelectField
            key={name}
            name={name}
            label={label}
            options={ANTIGEN_OPTIONS}
            value={values[name] ?? ''}
            emptyLabel=""
            emptyDisplayLabel=""
            compact
            antigen
            onChange={(value) => onChange({ [name]: value, donorAntigens: '' })}
          />
        ))}
      </div>
    </div>
  );
};
