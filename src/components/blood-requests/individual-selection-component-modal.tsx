import { rememberSavedOption } from '../../storage/repositories/saved-options';
import Modal from '../modal/modal';
import { RecipientExaminationFields } from '../transfusion-protocol/recipient-examination-fields';
import { SavedOptionsField } from '../transfusion-protocol/saved-options-field';
import type { ProtocolValues } from '../transfusion-protocol/protocol-types';
import styles from './individual-selection-component-modal.module.css';

const REQUIRED_COMPONENT_CATEGORY = 'individualSelectionRequiredComponent';
const REQUIRED_COMPONENT_FIXED_OPTIONS = [
  'эритроцитная взвесь',
  'отмытые эритроциты',
];

type Props = {
  requiredComponent: string;
  quantity: string;
  examinationValues: ProtocolValues;
  onLocalChange: (values: Record<string, string>) => void;
  onExaminationChange: (values: ProtocolValues) => void | Promise<void>;
  onClose: () => void;
};

export const IndividualSelectionComponentModal = ({
  requiredComponent,
  quantity,
  examinationValues,
  onLocalChange,
  onExaminationChange,
  onClose,
}: Props) => {
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
      title="Компонент крови и данные реципиента"
      onClose={handleClose}
      className={styles.modal}
    >
      <div className={styles.root}>
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

        <RecipientExaminationFields
          values={examinationValues}
          onChange={(values) => {
            void onExaminationChange(values);
          }}
        />
      </div>
    </Modal>
  );
};
