import {
  INDIVIDUAL_SELECTION_INDICATIONS,
  individualSelectionReasonLabel,
} from './component-request-447n';
import styles from './individual-selection-component-modal.module.css';

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export const IndividualSelectionReasonSelect = ({ value, onChange }: Props) => {
  const selected = individualSelectionReasonLabel(value);
  const isKnown = INDIVIDUAL_SELECTION_INDICATIONS.some(({ label }) => label === selected);

  return (
    <label className={styles.wide}>
      <span>Показания для индивидуального подбора</span>
      <select
        name="individualSelectionIndications"
        value={selected}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Выберите показание</option>
        {selected && !isKnown && <option value={selected}>{selected}</option>}
        {INDIVIDUAL_SELECTION_INDICATIONS.map(({ code, label }) => (
          <option key={code} value={label}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
};
