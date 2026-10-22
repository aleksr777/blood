import { BLOOD_COMPONENTS, getBloodComponentNameCategory } from '../../domain/blood-components';
import { SavedOptionsField } from '../transfusion-protocol/saved-options-field';
import styles from './blood-component-selector.module.css';

export type BloodComponentSelection = { group: string; name: string };

type Props = BloodComponentSelection & {
  inputName?: string;
  fixedGroup?: string;
  onChange: (selection: BloodComponentSelection) => void;
};

export const BloodComponentSelector = ({
  group,
  name,
  inputName = 'componentName',
  fixedGroup,
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
            aria-pressed={selectedGroup === value}
            disabled={Boolean(fixedGroup)}
            onClick={() => onChange({ group: value, name: value === selectedGroup ? name : '' })}
          >
            {label}
          </button>
        ))}
      </div>
      <div className={styles.name}>
        <div className={styles.label}>Наименование компонента донорской крови</div>
        <SavedOptionsField
          key={category}
          name={inputName}
          label="Наименование компонента донорской крови"
          category={category ?? 'componentName:unselected'}
          fixedOptions={selected ? [...selected.names] : []}
          value={name}
          disabled={!category}
          rememberOnBlur
          wrapOptions
          onChange={(nextName) => onChange({ group: selectedGroup, name: nextName })}
        />
      </div>
    </fieldset>
  );
};
