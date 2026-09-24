import type { ReactNode } from 'react';

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
