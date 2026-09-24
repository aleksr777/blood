import type { ReactNode } from 'react';

type TextFieldProps = {
  label: string;
  multiline?: boolean;
};

export const TextField = ({ label, multiline = false }: TextFieldProps) => {
  if (multiline) {
    return (
      <textarea
        className="form-control form-control--multiline"
        aria-label={label}
        title={label}
        rows={2}
        autoComplete="off"
        spellCheck={false}
      />
    );
  }

  return (
    <input
      className="form-control"
      aria-label={label}
      title={label}
      type="text"
      autoComplete="off"
      spellCheck={false}
    />
  );
};

type LabeledCellProps = {
  label: string;
  className?: string;
  centered?: boolean;
  colSpan?: number;
  rowSpan?: number;
};

export const LabeledCell = ({
  label,
  className = '',
  centered = false,
  colSpan,
  rowSpan,
}: LabeledCellProps) => (
  <td
    className={`${className} ${centered ? 'cell--centered' : ''}`}
    colSpan={colSpan}
    rowSpan={rowSpan}
  >
    <div className="cell-label">{label}</div>
    <TextField label={label} />
  </td>
);

type SectionTitleProps = {
  children: ReactNode;
};

export const SectionTitle = ({ children }: SectionTitleProps) => (
  <tr>
    <th className="section-title" colSpan={6}>
      {children}
    </th>
  </tr>
);
