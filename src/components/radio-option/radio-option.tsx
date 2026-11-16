import type { ReactNode } from 'react';
import ui from '../../styles/ui';

type Props = {
  name: string;
  checked: boolean;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
  onChange: (checked: boolean) => void;
};

export const RadioOption = ({ name, checked, disabled, className, children, onChange }: Props) => {
  return (
    <label className={className ?? ui.choiceLabel}>
      <input
        type="radio"
        name={name}
        checked={checked}
        disabled={disabled}
        onClick={() => {
          if (checked) onChange(false);
        }}
        onChange={() => {
          if (!checked) onChange(true);
        }}
      />
      <span>{children}</span>
    </label>
  );
};
