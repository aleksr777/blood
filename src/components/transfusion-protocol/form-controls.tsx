import type { ReactNode } from 'react';

type TextFieldProps = {
  label: string;
  multiline?: boolean;
  rows?: number;
  className?: string;
};

export const TextField = ({
  label,
  multiline = false,
  rows = 2,
  className = '',
}: TextFieldProps) => {
  const classes = `form-control ${multiline ? 'form-control--multiline' : ''} ${className}`;

  if (multiline) {
    return (
      <textarea
        className={classes}
        aria-label={label}
        title={label}
        rows={rows}
        autoComplete="off"
        spellCheck={false}
      />
    );
  }

  return (
    <input
      className={classes}
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
  children?: ReactNode;
  className?: string;
  centered?: boolean;
  colSpan?: number;
  rowSpan?: number;
};

export const LabeledCell = ({
  label,
  children,
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
    {children ?? <TextField label={label} />}
  </td>
);

type SectionTitleProps = {
  children: ReactNode;
  colSpan?: number;
};

export const SectionTitle = ({ children, colSpan = 6 }: SectionTitleProps) => (
  <tr>
    <th className="section-title" colSpan={colSpan}>
      {children}
    </th>
  </tr>
);
