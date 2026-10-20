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


const inferLegacyComponentGroup = (name: string) => {
  const normalized = name.trim().toLocaleLowerCase();

  if (normalized.includes('эритроц') || normalized.includes('эритромас')) {
    return 'erythrocytes';
  }
  if (
    normalized.includes('плазм') ||
    normalized === 'сзп' ||
    normalized.startsWith('сзп ')
  ) {
    return 'plasma-cryo';
  }
  if (normalized.includes('тромбоц')) {
    return 'platelets';
  }

  return '';
};

const ComponentNameInput = ({
  value,
  fixedOptions,
  componentGroup,
  onChange,
}: {
  value: string;
  fixedOptions: string[];
  componentGroup: string;
  onChange: (value: string) => void;
}) => {
  const [savedOptions, setSavedOptions] = useState<SavedOptionRecord[]>([]);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const { rootRef, dropdownState } = useOverlayDropdown(open, setOpen);

  useEffect(() => {
    let active = true;
    const category = getComponentNameOptionCategory(componentGroup);

    setOpen(false);
    setSavedOptions([]);
    setStatus('loading');

    if (!category) {
      setStatus('ready');
      return () => {
        active = false;
      };
    }

    void (async () => {
      try {
        const [scopedItems, legacyItems] = await Promise.all([
          loadSavedOptions(category),
          loadSavedOptions('componentName'),
        ]);

        const existingValues = new Set(
          scopedItems.map(({ value: itemValue }) =>
            itemValue.trim().toLocaleLowerCase(),
          ),
        );

        for (const item of legacyItems) {
          if (inferLegacyComponentGroup(item.value) !== componentGroup) continue;

          const normalized = item.value.trim().toLocaleLowerCase();
          if (!existingValues.has(normalized)) {
            await rememberSavedOption(category, item.value);
            existingValues.add(normalized);
          }
          await removeSavedOption('componentName', item.id);
        }

        const nextItems = await loadSavedOptions(category);
        if (!active) return;
        setSavedOptions(nextItems);
        setStatus('ready');
      } catch (error) {
        console.error(
          'Не удалось загрузить сохранённые наименования компонентов:',
          error,
        );
        if (active) setStatus('error');
      }
    })();

    return () => {
      active = false;
    };
  }, [componentGroup]);

  const fixedSet = new Set(
    fixedOptions.map((option) => option.trim().toLocaleLowerCase()),
  );
  const editableOptions = savedOptions.filter(
    (item) => !fixedSet.has(item.value.trim().toLocaleLowerCase()),
  );

  const rename = async (item: SavedOptionRecord, nextValue: string) => {
    try {
      const trimmed = nextValue.trim();
      const category = getComponentNameOptionCategory(componentGroup);
      if (!category) return;
      setSavedOptions(await renameSavedOption(category, item.id, trimmed));
      if (value === item.value) onChange(trimmed);
    } catch (error) {
      console.error('Не удалось изменить наименование компонента:', error);
    }
  };

  const remove = async (item: SavedOptionRecord) => {
    const previous = savedOptions;
    setSavedOptions((current) => current.filter(({ id }) => id !== item.id));
    if (value === item.value) onChange('');

    try {
      const category = getComponentNameOptionCategory(componentGroup);
      if (!category) return;
      setSavedOptions(await removeSavedOption(category, item.id));
    } catch (error) {
      setSavedOptions(previous);
      if (value === item.value) onChange(item.value);
      console.error('Не удалось удалить наименование компонента:', error);
    }
  };

  const emptyText =
    status === 'loading'
      ? 'Загрузка...'
      : status === 'error'
        ? 'Не удалось загрузить список'
        : 'Сохранённых вариантов нет';

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
        <button
          type="button"
          className={editorStyles.historyToggle}
          aria-label="Показать варианты наименования компонента"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          ▾
        </button>
      </div>

      <div
        className={editorStyles.historyDropdown}
        data-state={dropdownState}
        role="listbox"
        aria-label="Варианты наименования компонента"
        aria-hidden={dropdownState !== 'open'}
      >
        {fixedOptions.map((option) => (
          <button
            key={`fixed:${option}`}
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

        {editableOptions.length > 0 ? (
          editableOptions.map((item) => (
            <SavedOptionItem
              key={item.id}
              item={item}
              label="наименование компонента"
              onSelect={(selected) => {
                onChange(selected.value);
                setOpen(false);
              }}
              onRename={rename}
              onRemove={remove}
            />
          ))
        ) : fixedOptions.length === 0 ? (
          <div className={editorStyles.historyEmpty}>{emptyText}</div>
        ) : null}
      </div>
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
