import type { HTMLAttributes } from 'react';
import { RuledLabel, RuledText } from '../ruled-text/ruled-text';
import styles from './component-request-issued-page.module.css';

const columnWidths = [3, 20, 7, 7, 12, 6, 10, 8, 8, 8, 11];

const columnHeaders = [
  '№',
  'Наименование компонента донорской крови',
  'Группа крови донора',
  'Резус-принадлежность',
  'Фенотип донора',
  'Объем (мл)',
  '№ контейнера',
  'Код донора',
  'Дата заготовки',
  'Срок годности',
  'Изготовитель',
];

type Props = {
  doctorName: string;
  footerEdit: HTMLAttributes<HTMLDivElement>;
};

export const ComponentRequestIssuedPage = ({ doctorName, footerEdit }: Props) => (
  <div className={styles.content}>
    <h2 className={styles.title}>Выдано из трансфузиологического кабинета</h2>
    <table className={styles.table} aria-label="Таблица выдачи компонентов крови">
      <colgroup>
        {columnWidths.map((width, index) => (
          <col key={index} style={{ width: `${width}%` }} />
        ))}
      </colgroup>
      <thead>
        <tr>
          {columnHeaders.map((header) => (
            <th key={header}>{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: 6 }, (_, index) => (
          <tr key={index}>
            {Array.from({ length: columnHeaders.length }, (_, cellIndex) => (
              <td key={cellIndex}>&nbsp;</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
    <div className={styles.footer}>
      <div className={styles.footerRow}>
        <RuledLabel className={styles.footerLabel}>Дата:</RuledLabel>
        <RuledText className={styles.dateLine} />
      </div>
      <div
        {...footerEdit}
        className={`${styles.footerRow} ${footerEdit.className ?? ''}`}
        aria-label="Получил компоненты крови"
      >
        <RuledLabel className={styles.footerLabel}>Получил компоненты крови:</RuledLabel>
        <RuledText className={styles.signatureLine}>{doctorName}</RuledText>
      </div>
      <div className={styles.footerRow}>
        <RuledLabel className={styles.footerLabel}>Выдал компоненты крови:</RuledLabel>
        <RuledText className={styles.signatureLine} />
      </div>
    </div>
  </div>
);
