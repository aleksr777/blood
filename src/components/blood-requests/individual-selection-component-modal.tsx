import { rememberSavedOption } from '../../storage/repositories/saved-options';
import Modal from '../modal/modal';
import { Choice } from '../transfusion-protocol/indication-controls';
import {
  ABO_OPTIONS,
  BloodGroupSelectField,
  getBloodGroupTone,
  normalizeBloodGroupRh,
  RH_OPTIONS,
} from '../transfusion-protocol/blood-group-select-field';
import {
  IndicationComponentSelector,
  IndicationsFields,
} from '../transfusion-protocol/indications-fields';
import type { ProtocolValues } from '../transfusion-protocol/protocol-types';
import { SavedOptionsField } from '../transfusion-protocol/saved-options-field';
import { sanitizeDoseQuantity } from './dose-quantity';
import styles from './individual-selection-component-modal.module.css';

const REQUIRED_COMPONENT_CATEGORY = 'individualSelectionRequiredComponent';
const REQUIRED_COMPONENT_FIXED_OPTIONS = [
  'эритроцитная взвесь',
  'отмытые эритроциты',
];

const REQUEST_REQUIRED_COMPONENT_CONFIG: Record<
  string,
  { category: string; fixedOptions: string[] }
> = {
  erythrocytes: {
    category: 'componentRequestRequiredComponent:erythrocytes',
    fixedOptions: ['эритроцитная взвесь', 'отмытые эритроциты'],
  },
  'plasma-cryo': {
    category: 'componentRequestRequiredComponent:plasma',
    fixedOptions: ['свежезамороженная плазма'],
  },
  platelets: {
    category: 'componentRequestRequiredComponent:platelets',
    fixedOptions: ['тромбоциты', 'концентрат тромбоцитов'],
  },
};

const UNSELECTED_REQUEST_COMPONENT_CATEGORY =
  'componentRequestRequiredComponent:unselected';

type Props = {
  requiredComponent: string;
  componentAbo?: string;
  componentRh?: string;
  quantity: string;
  individualSelectionIndications: string;
  indicationValues: ProtocolValues;
  transfusionOrder?: string;
  componentSelectionRequirement?: string;
  showRequestOptions?: boolean;
  fixedIndicationComponent?: string;
  onLocalChange: (values: Record<string, string>) => void;
  onIndicationsChange: (values: ProtocolValues) => void;
  onClose: () => void;
};

export const IndividualSelectionComponentModal = ({
  requiredComponent,
  componentAbo = '',
  componentRh = '',
  quantity,
  individualSelectionIndications,
  indicationValues,
  transfusionOrder = '',
  componentSelectionRequirement = '',
  showRequestOptions = false,
  fixedIndicationComponent,
  onLocalChange,
  onIndicationsChange,
  onClose,
}: Props) => {
  const component =
    fixedIndicationComponent ||
    indicationValues.componentGroup ||
    indicationValues.indicationComponent;
  const effectiveIndicationValues = fixedIndicationComponent
    ? {
        ...indicationValues,
        indicationComponent: fixedIndicationComponent,
      }
    : indicationValues;
  const normalizedComponentRh = normalizeBloodGroupRh(componentRh);
  const componentBloodGroupTone = getBloodGroupTone(normalizedComponentRh);
  const isErythrocytes = component === 'erythrocytes';
  const requiresIndividualSelection =
    isErythrocytes && componentSelectionRequirement === 'individual';
  const requestComponentConfig = showRequestOptions
    ? REQUEST_REQUIRED_COMPONENT_CONFIG[component]
    : undefined;
  const requiredComponentCategory =
    requestComponentConfig?.category ??
    (showRequestOptions
      ? UNSELECTED_REQUEST_COMPONENT_CATEGORY
      : REQUIRED_COMPONENT_CATEGORY);
  const requiredComponentFixedOptions =
    requestComponentConfig?.fixedOptions ??
    (showRequestOptions ? [] : REQUIRED_COMPONENT_FIXED_OPTIONS);

  const handleIndicationsChange = (changes: ProtocolValues) => {
    onIndicationsChange(changes);

    if (!showRequestOptions || !changes.indicationComponent) return;

    const componentChanged = changes.indicationComponent !== component;
    const nextChanges: Record<string, string> = {};

    if (componentChanged) {
      nextChanges.requiredComponent = '';
    }

    if (changes.indicationComponent !== 'erythrocytes') {
      nextChanges.componentSelectionRequirement = '';
    }

    if (Object.keys(nextChanges).length > 0) {
      onLocalChange(nextChanges);
    }
  };

  const setComponentSelectionRequirement = (value: string) => {
    onLocalChange({
      componentSelectionRequirement: value,
    });
  };

  const handleClose = () => {
    const value = requiredComponent.trim();
    const isFixedOption = requiredComponentFixedOptions.some(
      (option) =>
        option.toLocaleLowerCase('ru-RU') === value.toLocaleLowerCase('ru-RU'),
    );
    const canRememberValue =
      !showRequestOptions || Boolean(requestComponentConfig);

    if (value && !isFixedOption && canRememberValue) {
      void rememberSavedOption(requiredComponentCategory, value).catch(
        (error: unknown) => {
          console.error(
            'Не удалось сохранить вариант наименования требуемого компонента:',
            error,
          );
        },
      );
    }

    onClose();
  };

  return (
    <Modal
      title="Выбор компонента и показания"
      onClose={handleClose}
      className={styles.modal}
    >
      <div className={styles.root}>
        {!fixedIndicationComponent && (
          <IndicationComponentSelector
            values={indicationValues}
            onChange={handleIndicationsChange}
          />
        )}

        {showRequestOptions && (
          <>
            <div className={styles.divider} />

            <fieldset className={styles.optionGroup}>
              <legend>Порядок трансфузии</legend>
              <div className={styles.radioOptions}>
                <Choice
                  type="radio"
                  name="componentRequestTransfusionOrder"
                  checked={transfusionOrder === 'planned'}
                  onChange={() => onLocalChange({ transfusionOrder: 'planned' })}
                >
                  плановая
                </Choice>
                <Choice
                  type="radio"
                  name="componentRequestTransfusionOrder"
                  checked={transfusionOrder === 'emergency'}
                  onChange={() => onLocalChange({ transfusionOrder: 'emergency' })}
                >
                  экстренная
                </Choice>
              </div>
            </fieldset>
          </>
        )}

        {(!fixedIndicationComponent || showRequestOptions) && (
          <div className={styles.divider} />
        )}

        <div className={styles.localGrid}>
          <label className={styles.wide}>
            <span>Наименование требуемого компонента</span>
            <SavedOptionsField
              name="requiredComponent"
              label="Наименование требуемого компонента"
              category={requiredComponentCategory}
              value={requiredComponent}
              fixedOptions={requiredComponentFixedOptions}
              onChange={(value) => onLocalChange({ requiredComponent: value })}
            />
          </label>

          <label className={styles.quantityField}>
            <span>Количество доз</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={sanitizeDoseQuantity(quantity)}
              onChange={(event) =>
                onLocalChange({
                  quantity: sanitizeDoseQuantity(event.target.value),
                })
              }
            />
          </label>
        </div>

        {showRequestOptions && (
          <>
            <div className={styles.bloodGroupGrid}>
              <BloodGroupSelectField
                name="componentAbo"
                label="Группа крови AB0 компонента"
                options={ABO_OPTIONS}
                value={componentAbo}
                tone={componentBloodGroupTone}
                onChange={(value) => onLocalChange({ componentAbo: value })}
              />
              <BloodGroupSelectField
                name="componentRh"
                label="Резус-принадлежность компонента"
                options={RH_OPTIONS}
                value={normalizedComponentRh}
                tone={componentBloodGroupTone}
                onChange={(value) => onLocalChange({ componentRh: value })}
              />
            </div>
          </>
        )}

        <div className={styles.divider} />

        <section className={styles.indicationsSection}>
          <div className={styles.sectionTitle}>Показания к трансфузии</div>
          <IndicationsFields
            values={effectiveIndicationValues}
            showComponentSelector={false}
            onChange={handleIndicationsChange}
          />
        </section>

        {showRequestOptions && isErythrocytes && (
          <>
            <div className={styles.divider} />

            <fieldset className={styles.optionGroup}>
              <legend>Подбор компонента</legend>
              <div className={styles.radioOptions}>
                <Choice
                  type="radio"
                  name="componentRequestSelectionRequirement"
                  checked={componentSelectionRequirement === 'not-required'}
                  onChange={() =>
                    setComponentSelectionRequirement('not-required')
                  }
                >
                  индивидуальный подбор и подбор по фенотипу не требуется
                </Choice>
                <Choice
                  type="radio"
                  name="componentRequestSelectionRequirement"
                  checked={componentSelectionRequirement === 'phenotype'}
                  onChange={() => setComponentSelectionRequirement('phenotype')}
                >
                  требуется подбор по фенотипу
                </Choice>
                <Choice
                  type="radio"
                  name="componentRequestSelectionRequirement"
                  checked={componentSelectionRequirement === 'individual'}
                  onChange={() => setComponentSelectionRequirement('individual')}
                >
                  требуется индивидуальный подбор
                </Choice>
              </div>
              {componentSelectionRequirement && (
                <button
                  type="button"
                  className={styles.resetSelectionButton}
                  onClick={() => setComponentSelectionRequirement('')}
                >
                  Сбросить выбор
                </button>
              )}
            </fieldset>
          </>
        )}

        {(!showRequestOptions || requiresIndividualSelection) && (
          <>
            <div className={styles.divider} />

            <div className={styles.localGrid}>
              <label className={styles.wide}>
                <span>Показания для индивидуального подбора</span>
                <textarea
                  value={individualSelectionIndications}
                  onChange={(event) =>
                    onLocalChange({
                      individualSelectionIndications: event.target.value,
                    })
                  }
                />
              </label>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
