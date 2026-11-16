import {
  INDIVIDUAL_SELECTION_INDICATIONS,
  INDIVIDUAL_SELECTION_REASON_CATEGORY,
  individualSelectionReasonLabel,
} from './component-request-447n';
import { SavedOptionsField } from '../transfusion-protocol/saved-options-field';
import styles from './individual-selection-component-modal.module.css';

type Props = {
  value: string;
  coded?: boolean;
  onChange: (value: string) => void;
};

export const IndividualSelectionReasonSelect = ({ value, coded = false, onChange }: Props) => {
  const fixedOptions = INDIVIDUAL_SELECTION_INDICATIONS.map(({ code, label }) =>
    coded ? `${code} — ${label}` : label,
  );
  const known = INDIVIDUAL_SELECTION_INDICATIONS.find(({ code }) => code === value);
  const selected =
    coded && known ? `${known.code} — ${known.label}` : individualSelectionReasonLabel(value);
  const label = coded
    ? 'Показание для индивидуального подбора (графа 10)'
    : 'Показания для индивидуального подбора';

  return (
    <div className={styles.wide}>
      <span>{label}</span>
      <SavedOptionsField
        name={coded ? 'individualSelectionCode' : 'individualSelectionIndications'}
        label={label}
        category={INDIVIDUAL_SELECTION_REASON_CATEGORY}
        value={selected}
        fixedOptions={fixedOptions}
        wrapOptions
        onChange={(next) => {
          const match = INDIVIDUAL_SELECTION_INDICATIONS.find(
            ({ code, label: text }) => next === `${code} — ${text}` || next === text,
          );
          onChange(match ? (coded ? match.code : match.label) : next);
        }}
      />
    </div>
  );
};
