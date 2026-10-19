import { rememberSavedOption } from '../../storage/repositories/saved-options';
import Modal from '../modal/modal';
import { Choice } from '../transfusion-protocol/indication-controls';
import {
  IndicationComponentSelector,
  IndicationsFields,
} from '../transfusion-protocol/indications-fields';
import type { ProtocolValues } from '../transfusion-protocol/protocol-types';
import { SavedOptionsField } from '../transfusion-protocol/saved-options-field';
import styles from './individual-selection-component-modal.module.css';

const REQUIRED_COMPONENT_CATEGORY = 'individualSelectionRequiredComponent';
const REQUIRED_COMPONENT_FIXED_OPTIONS = [
  'эритроцитная взвесь',
  'отмытые эритроциты',
];

type Props = {
  requiredComponent: string;
  quantity: string;
  individualSelectionIndications: string;
  indicationValues: ProtocolValues;
  transfusionOrder?: string;
  componentSelectionRequirement?: string;
  showRequestOptions?: boolean;
  onLocalChange: (values: Record<string, string>) => void;
  onIndicationsChange: (values: ProtocolValues) => void;
  onClose: () => void;
};

export const IndividualSelectionComponentModal = ({
  requiredComponent,
  quantity,
  individualSelectionIndications,
  indicationValues,
  transfusionOrder = '',
  componentSelectionRequirement = '',
  showRequestOptions = false,
  onLocalChange,
  onIndicationsChange,
  onClose,
}: Props) => {
  const component =
    indicationValues.componentGroup || indicationValues.indicationComponent;
  const isErythrocytes = component === 'erythrocytes';
  const requiresIndividualSelection =
    isErythrocytes && componentSelectionRequirement === 'individual';

  const handleIndicationsChange = (changes: ProtocolValues) => {
    onIndicationsChange(changes);

    if (
      showRequestOptions &&
      changes.indicationComponent &&
      changes.indicationComponent !== 'erythrocytes'
    ) {
      onLocalChange({
        componentSelectionRequirement: '',
        individualSelectionIndications: '',
      });
    }
  };

  const setComponentSelectionRequirement = (value: string) => {
    onLocalChange({
      componentSelectionRequirement: value,
      ...(value === 'individual'
        ? {}
        : { individualSelectionIndications: '' }),
    });
  };

  const handleClose = () => {
    const value = requiredComponent.trim();
    const isFixedOption = REQUIRED_COMPONENT_FIXED_OPTIONS.some(
      (option) =>
        option.toLocaleLowerCase('ru-RU') === value.toLocaleLowerCase('ru-RU'),
    );

    if (value && !isFixedOption) {
      void rememberSavedOption(REQUIRED_COMPONENT_CATEGORY, value).catch(
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
        <IndicationComponentSelector
          values={indicationValues}
          onChange={handleIndicationsChange}
        />

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

        <div className={styles.divider} />

        <div className={styles.localGrid}>
          <label className={styles.wide}>
            <span>Наименование требуемого компонента</span>
            <SavedOptionsField
              name="requiredComponent"
              label="Наименование требуемого компонента"
              category={REQUIRED_COMPONENT_CATEGORY}
              value={requiredComponent}
              fixedOptions={REQUIRED_COMPONENT_FIXED_OPTIONS}
              onChange={(value) => onLocalChange({ requiredComponent: value })}
            />
          </label>

          <label className={styles.wide}>
            <span>Количество</span>
            <input
              value={quantity}
              onChange={(event) => onLocalChange({ quantity: event.target.value })}
            />
          </label>
        </div>

        <div className={styles.divider} />

        <section className={styles.indicationsSection}>
          <div className={styles.sectionTitle}>Показания к трансфузии</div>
          <IndicationsFields
            values={indicationValues}
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
