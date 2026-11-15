import { Choice } from '../transfusion-protocol/indication-controls';
import { INDIVIDUAL_SELECTION_INDICATIONS } from './component-request-447n';
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
      <label className={styles.selectionReason}>
        <span>Код показания для индивидуального подбора (графа 10)</span>
        <select
          name="individualSelectionCode"
          value={values.individualSelectionCode}
          onChange={(event) => onChange({ individualSelectionCode: event.target.value })}
        >
          <option value="">Выберите показание</option>
          {INDIVIDUAL_SELECTION_INDICATIONS.map(({ code, label }) => (
            <option key={code} value={code}>
              {code} — {label}
            </option>
          ))}
        </select>
      </label>
    )}
  </fieldset>
);
