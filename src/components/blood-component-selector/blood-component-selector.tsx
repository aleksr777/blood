import { BLOOD_COMPONENTS, getBloodComponentNameCategory } from '../../domain/blood-components';
import { SavedOptionsField } from '../transfusion-protocol/saved-options-field';
import styles from './blood-component-selector.module.css';

export type BloodComponentSelection = { group: string; name: string };

type Props = BloodComponentSelection & {
  inputName?: string;
  fixedGroup?: string;
  showName?: boolean;
  catalogOptions?: readonly { code: string; name: string }[];
  selectedCode?: string;
  onCodeChange?: (code: string) => void;
  onChange: (selection: BloodComponentSelection) => void;
};

export const BloodComponentSelector = ({
  group,
  name,
  inputName = 'componentName',
  fixedGroup,
  showName = true,
  catalogOptions,
  selectedCode,
  onCodeChange,
  onChange,
}: Props) => {
  const selectedGroup = fixedGroup || group;
  const selected = BLOOD_COMPONENTS.find(({ value }) => value === selectedGroup);
  const category = getBloodComponentNameCategory(selectedGroup);
  const components = fixedGroup
    ? BLOOD_COMPONENTS.filter(({ value }) => value === fixedGroup)
    : BLOOD_COMPONENTS;

  return (
    <fieldset className={styles.root} data-blood-component-selector>
      <legend>Группа компонентов крови</legend>
      <div className={styles.choices} data-fixed={Boolean(fixedGroup)}>
        {components.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            className={styles.choice}
            data-component={value}
            aria-pressed={selectedGroup === value}
            disabled={Boolean(fixedGroup)}
            onClick={() => onChange({ group: value, name: value === selectedGroup ? name : '' })}
          >
            {label}
          </button>
        ))}
      </div>
      {showName && selected && category && (
        <div className={styles.name}>
          {catalogOptions ? (
            <label>
              <span className={styles.label}>Наименование компонента донорской крови</span>
              <select
                name={inputName}
                value={selectedCode || ''}
                onChange={(event) => onCodeChange?.(event.target.value)}
              >
                <option value="">Выберите компонент донорской крови</option>
                {catalogOptions.map(({ code, name: componentName }) => (
                  <option key={code} value={code}>
                    {code} — {componentName}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <>
              <div className={styles.label}>Наименование компонента донорской крови</div>
              <SavedOptionsField
                key={category}
                name={inputName}
                label="Наименование компонента донорской крови"
                category={category}
                fixedOptions={[...selected.names]}
                value={name}
                rememberOnBlur
                wrapOptions
                onChange={(nextName) => onChange({ group: selectedGroup, name: nextName })}
              />
            </>
          )}
        </div>
      )}
    </fieldset>
  );
};
