import { useState, type ReactNode } from 'react';
import { RadioOption } from './radio-option';

type Props = {
  name: string;
  value?: string;
  defaultValue?: string;
  options: readonly { value: string; label: ReactNode }[];
  className?: string;
  onChange: (value: string) => void;
};

export const RadioGroup = ({
  name,
  value,
  defaultValue = '',
  options,
  className,
  onChange,
}: Props) => {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const selected = value ?? uncontrolledValue;
  return options.map((option) => (
    <RadioOption
      key={option.value}
      name={name}
      className={className}
      checked={selected === option.value}
      onChange={(checked) => {
        const next = checked ? option.value : '';
        if (value === undefined) setUncontrolledValue(next);
        onChange(next);
      }}
    >
      {option.label}
    </RadioOption>
  ));
};
