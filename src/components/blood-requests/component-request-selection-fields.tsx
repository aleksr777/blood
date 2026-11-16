import { Choice } from '../transfusion-protocol/indication-controls';
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
      <Choice
        type="radio"
        name="request447nIndividualSelection"
        checked={values.individualSelectionRequired === 'yes'}
        onChange={() => onChange({ individualSelectionRequired: 'yes' })}
      >
        Да
      </Choice>
      <Choice
        type="radio"
        name="request447nIndividualSelection"
        checked={values.individualSelectionRequired === 'no'}
        onChange={() =>
          onChange({ individualSelectionRequired: 'no', individualSelectionCode: '' })
        }
      >
        Нет
      </Choice>
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
