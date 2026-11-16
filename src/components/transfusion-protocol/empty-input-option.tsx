import styles from './protocol-editor.module.css';

export const EmptyInputOption = ({ label, onSelect }: { label: string; onSelect: () => void }) => (
  <div className={styles.historyFixedRow}>
    <button
      type="button"
      className={styles.historyValue}
      aria-label={`Очистить поле: ${label}`}
      title="Очистить поле и ввести свой вариант"
      onClick={onSelect}
    />
  </div>
);
