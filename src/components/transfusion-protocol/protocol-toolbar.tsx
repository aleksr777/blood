type Props = {
  status: string;
  warning: string;
  dangerWarning: string;
  bloodGroupWarning: string;
  onDismissBloodGroupWarning: () => void;
  onClear: () => void;
  onNew: () => void;
  onOpenRegistry: () => void;
  onSave: () => void;
  pageCount: number;
  onPrintPage: (pageIndex: number) => void;
};

export const ProtocolToolbar = ({
  status,
  warning,
  dangerWarning,
  bloodGroupWarning,
  onDismissBloodGroupWarning,
  onClear,
  onNew,
  onOpenRegistry,
  onSave,
  pageCount,
  onPrintPage,
}: Props) => (
  <header className="app-header">
    <div className="toolbar-wrap">
    <div className="print-actions" aria-label="Панель действий">
      <button type="button" className="clear-button" onClick={onClear}>
        Очистить бланк
      </button>
      <button type="button" className="new-button" onClick={onNew}>
        Новый бланк
      </button>
      <button type="button" className="secondary-button" onClick={onOpenRegistry}>
        Реципиенты
      </button>
      <button type="button" className="save-button" onClick={onSave}>
        Сохранить
      </button>
      {Array.from({ length: pageCount }, (_, pageIndex) => (
        <button
          key={pageIndex}
          type="button"
          className="print-button"
          onClick={() => onPrintPage(pageIndex)}
        >
          Печать страницы {pageIndex + 1}
        </button>
      ))}
    </div>
    {status && (
      <div className="toolbar-status" role="status">
        {status}
      </div>
    )}
    {dangerWarning && (
      <div className="toolbar-danger-warning" role="alert">
        {dangerWarning}
      </div>
    )}
    {bloodGroupWarning && (
      <div className="toolbar-blood-group-warning" role="alert">
        <span>{bloodGroupWarning}</span>
        <button
          type="button"
          className="toolbar-warning-dismiss"
          aria-label="Закрыть предупреждение"
          onClick={onDismissBloodGroupWarning}
        >
          ×
        </button>
      </div>
    )}
    {warning && (
      <div className="toolbar-warning" role="alert">
        {warning}
      </div>
    )}
    </div>
  </header>
);
