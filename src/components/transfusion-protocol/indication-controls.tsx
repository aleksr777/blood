import { FormCheckbox, FormTextarea } from '../form-input/form-input';
import type { ReactNode } from 'react';
import type { ProtocolValues } from './protocol-types';
import styles from './indications-fields.module.css';

export type IndicationProps = {
  values: ProtocolValues;
  onChange: (values: ProtocolValues) => void;
};

type ChoiceProps = {
  name: string;
  checked: boolean;
  children: ReactNode;
  onChange: () => void;
};

export const Choice = ({ name, checked, children, onChange }: ChoiceProps) => (
  <label className={styles.choice}>
    <FormCheckbox name={name} checked={checked} onChange={onChange} />
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
    <Choice name={name} checked={checked} onChange={() => onChange({ [name]: checked ? '' : '1' })}>
      {label}
    </Choice>
    {checked && (
      <FormTextarea
        className={styles.otherText}
        name={`${name}Text`}
        rows={4}
        value={text}
        onChange={(event) => onChange({ [`${name}Text`]: event.target.value })}
      />
    )}
  </div>
);
