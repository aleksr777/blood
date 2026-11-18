import styles from './time-picker.module.css';

type Props = {
  label: string;
  values: string[];
  selected: string;
  onSelect: (value: string) => void;
};

export const TimePickerColumn = ({ label, values, selected, onSelect }: Props) => (
  <span className={styles.column} role="listbox" aria-label={label}>
    {values.map((value) => (
      <button
        type="button"
        role="option"
        aria-selected={selected === value}
        className={styles.option}
        key={value}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onSelect(value);
        }}
      >
        {value}
      </button>
    ))}
  </span>
);
