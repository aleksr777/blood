import Modal from '../modal/modal';
import { WarningNotice } from '../warning-notice/warning-notice';
import { Choice } from '../transfusion-protocol/indication-controls';
import {
  ABO_OPTIONS,
  BloodGroupSelectField,
  getBloodGroupTone,
  normalizeBloodGroupRh,
  RH_OPTIONS,
} from '../transfusion-protocol/blood-group-select-field';
import { IndicationsFields } from '../transfusion-protocol/indications-fields';
import {
  BloodComponentSelector,
  type BloodComponentSelection,
} from '../blood-component-selector/blood-component-selector';
import { BLOOD_COMPONENTS, inferBloodComponentGroup } from '../../domain/blood-components';
import type { ProtocolValues } from '../transfusion-protocol/protocol-types';
import { BoundedIntegerInput } from '../bounded-integer-input/bounded-integer-input';
import editorStyles from '../transfusion-protocol/protocol-editor.module.css';
import styles from './individual-selection-component-modal.module.css';

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
  bloodGroupWarning?: string;
  onDismissBloodGroupWarning?: () => void;
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
  bloodGroupWarning = '',
  onDismissBloodGroupWarning,
  onLocalChange,
  onIndicationsChange,
  onClose,
}: Props) => {
  const component =
    indicationValues.componentGroup ||
    indicationValues.indicationComponent ||
    inferBloodComponentGroup(requiredComponent);
  const effectiveIndicationValues = {
    ...indicationValues,
    componentGroup: component,
    indicationComponent: component,
  };
  const normalizedComponentRh = normalizeBloodGroupRh(componentRh);
  const componentBloodGroupTone = getBloodGroupTone(normalizedComponentRh);
  const isErythrocytes = component === 'erythrocytes';
  const hasSelectedComponent = BLOOD_COMPONENTS.some(({ value }) => value === component);
  const requiresIndividualSelection =
    isErythrocytes && componentSelectionRequirement === 'individual';

  const handleIndicationsChange = (changes: ProtocolValues) => {
    onIndicationsChange({
      ...(component ? { componentGroup: component, indicationComponent: component } : {}),
      ...changes,
    });

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

  const handleComponentChange = ({ group, name }: BloodComponentSelection) => {
    if (
      group !== indicationValues.componentGroup ||
      group !== indicationValues.indicationComponent
    ) {
      handleIndicationsChange({ componentGroup: group, indicationComponent: group });
    }
    onLocalChange({ requiredComponent: name });
  };

  const setComponentSelectionRequirement = (value: string) => {
    onLocalChange({
      componentSelectionRequirement: value,
    });
  };

  return (
    <Modal title="Выбор компонента и показания" onClose={onClose} className={styles.modal}>
      <div className={styles.root}>
        {showRequestOptions && (
          <WarningNotice
            className={editorStyles.bloodGroupWarning}
            message={bloodGroupWarning}
            onDismiss={onDismissBloodGroupWarning}
          />
        )}

        <BloodComponentSelector
          group={component ?? ''}
          name={requiredComponent}
          inputName="requiredComponent"
          onChange={handleComponentChange}
        />

        <div className={styles.localGrid}>
          <label className={styles.quantityField}>
            <span>Количество доз</span>
            <BoundedIntegerInput
              name="quantity"
              min={1}
              max={99}
              value={quantity}
              onChange={(value) => onLocalChange({ quantity: value })}
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
                  onChange={() => setComponentSelectionRequirement('not-required')}
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

        {hasSelectedComponent && (
          <>
            <div className={styles.divider} />

            <section className={styles.indicationsSection}>
              <div className={styles.sectionTitle}>Показания к трансфузии</div>
              <IndicationsFields
                values={effectiveIndicationValues}
                showComponentSelector={false}
                onChange={handleIndicationsChange}
              />
            </section>
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
