import { RadioGroup } from '../radio-option/radio-group';
import { IndividualSelectionReasonSelect } from './individual-selection-reason-select';
import type { ComponentRequestDetailsValues } from './component-request-details-types';
import styles from './component-request-details-modal.module.css';

type Props = {
  values: ComponentRequestDetailsValues;
  onChange: (values: Record<string, string>) => void;
};

export const ComponentRequestIndividualSelectionFields = ({ values, onChange }: Props) => (
  <fieldset className={styles.selection}>
    <legend>Необходимость индивидуального подбора (графа 9)</legend>
    <div className={styles.options}>
      <RadioGroup
        name="request447nIndividualSelection"
        value={values.individualSelectionRequired}
        options={[
          { value: 'yes', label: 'Да' },
          { value: 'no', label: 'Нет' },
        ]}
        onChange={(next) =>
          onChange({
            individualSelectionRequired: next,
            ...(next !== 'yes' ? { individualSelectionCode: '' } : {}),
          })
        }
      />
    </div>
    {values.individualSelectionRequired === 'yes' && (
      <div className={styles.selectionReason}>
        <IndividualSelectionReasonSelect
          coded
          value={values.individualSelectionCode}
          onChange={(value) => onChange({ individualSelectionCode: value })}
        />
      </div>
    )}
  </fieldset>
);
