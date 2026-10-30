import { FormTextarea } from '../form-input/form-input';
import styles from './previous-transfusion-input.module.css';

type Props = {
  generated: string;
  manual: string;
  label: string;
  onChange: (text: string) => void;
  onRemove: () => void;
};

export const PreviousTransfusionInput = ({
  generated,
  manual,
  label,
  onChange,
  onRemove,
}: Props) => (
  <div className={styles.input} data-has-generated={Boolean(generated)}>
    {generated && (
      <div className={styles.generated}>
        <div
          role="textbox"
          aria-label="Внесённые данные о предыдущих трансфузиях"
          aria-readonly="true"
          aria-multiline="true"
          tabIndex={0}
          className={styles.generatedText}
        >
          {generated}
        </div>
        <button
          type="button"
          className={styles.remove}
          aria-label="Удалить внесённые данные о трансфузиях"
          title="Удалить внесённые данные"
          onClick={onRemove}
        >
          ×
        </button>
      </div>
    )}
    <FormTextarea
      name="previousTransfusions"
      aria-label={label}
      placeholder={generated ? 'Дополнительные сведения' : undefined}
      rows={4}
      value={manual}
      onChange={(event) => onChange(event.target.value)}
    />
  </div>
);
