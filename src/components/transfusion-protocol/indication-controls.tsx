import type { ReactNode } from 'react';
import type { ProtocolValues } from './protocol-types';
import styles from './indications-fields.module.css';

export type IndicationProps = {
  values: ProtocolValues;
  onChange: (values: ProtocolValues) => void;
};

type ChoiceProps = {
  type: 'radio' | 'checkbox';
  name: string;
  checked: boolean;
  children: ReactNode;
  onChange: () => void;
};

export const Choice = ({ type, name, checked, children, onChange }: ChoiceProps) => (
  <label className={styles.choice}>
    <input type={type} name={name} checked={checked} onChange={onChange} />
    <span>{children}</span>
  </label>
);

export const OtherChoice = ({
  checked,
  text,
  name,
  label,
  onChange,
}: {
  checked: boolean;
  text: string;
  name: string;
  label: string;
  onChange: (values: ProtocolValues) => void;
}) => (
  <div>
    <Choice
      type="checkbox"
      name={name}
      checked={checked}
      onChange={() => onChange({ [name]: checked ? '' : '1' })}
    >
      {label}
    </Choice>
    {checked && (
      <textarea
        className={styles.otherText}
        rows={2}
        value={text}
        onChange={(event) => onChange({ [`${name}Text`]: event.target.value })}
      />
    )}
  </div>
);
