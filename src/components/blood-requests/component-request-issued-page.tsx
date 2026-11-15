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

export const ComponentRequestIssuedPage = () => (
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
        <span className={styles.footerLabel}>Дата:</span>
        <span className={styles.dateLine} />
      </div>
      <div className={styles.footerRow}>
        <span className={styles.footerLabel}>Получил компоненты крови:</span>
        <span className={styles.signatureLine} />
      </div>
      <div className={styles.footerRow}>
        <span className={styles.footerLabel}>Выдал компоненты крови:</span>
        <span className={styles.signatureLine} />
      </div>
    </div>
  </div>
);
