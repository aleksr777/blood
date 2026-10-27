import { useEffect, useState } from 'react';

type Props = {
  name: string;
  value: string;
  min: number;
  max: number;
  readOnly?: boolean;
  onChange: (value: string) => void;
};

export const BoundedIntegerInput = ({ name, value, min, max, readOnly, onChange }: Props) => {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const valid = (text: string) =>
    text === '' || (/^\d+$/.test(text) && Number(text) >= min && Number(text) <= max);

  return (
    <input
      name={name}
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      step="1"
      readOnly={readOnly}
      value={draft}
      aria-invalid={draft !== '' && !valid(draft) ? true : undefined}
      onKeyDown={(event) => {
        if (
          !event.ctrlKey &&
          !event.metaKey &&
          ['e', 'E', '+', '-', '.', ','].includes(event.key)
        ) {
          event.preventDefault();
        }
      }}
      onChange={(event) => {
        if (readOnly) return;
        const next = event.target.value;
        if (next.length > String(max).length) return;
        const prefix = min > 1 && /^\d+$/.test(next) && Number(next) > 0 && Number(next) < min;
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
