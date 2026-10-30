import { useEffect, useState } from 'react';

type Props = {
  name: string;
  value: string;
  min: number;
  max: number;
  step?: string;
  readOnly?: boolean;
  onChange: (value: string) => void;
};

export const BoundedNumberInput = ({
  name,
  value,
  min,
  max,
  step = '1',
  readOnly,
  onChange,
}: Props) => {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const integer = step === '1';
  const pattern = integer ? /^\d+$/ : /^\d+(?:\.\d*)?$/;
  const valid = (text: string) =>
    text === '' ||
    (pattern.test(text) &&
      Number.isFinite(Number(text)) &&
      Number(text) >= min &&
      Number(text) <= max);

  return (
    <input
      name={name}
      type="number"
      inputMode={integer ? 'numeric' : 'decimal'}
      min={min}
      max={max}
      step={step}
      readOnly={readOnly}
      value={draft}
      aria-invalid={draft !== '' && !valid(draft) ? true : undefined}
      onKeyDown={(event) => {
        const blocked = integer ? ['e', 'E', '+', '-', '.', ','] : ['e', 'E', '+', '-'];
        if (!event.ctrlKey && !event.metaKey && blocked.includes(event.key)) event.preventDefault();
      }}
      onChange={(event) => {
        if (readOnly || event.target.validity.badInput) return;
        const next = event.target.value;
        if (next.split('.')[0].length > String(Math.floor(max)).length) return;
        const prefix = min > 0 && /^\d+$/.test(next) && Number(next) > 0 && Number(next) < min;
        if (!valid(next) && !prefix) return;
        setDraft(next);
        if (valid(next)) onChange(next);
      }}
      onBlur={() => {
        if (!valid(draft)) setDraft(value);
      }}
    />
  );
};
