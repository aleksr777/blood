type Props = {
  status: string;
  onClear: () => void;
  onOpenRegistry: () => void;
  onSave: () => void;
  pageCount: number;
  onPrintPage: (pageIndex: number) => void;
};

export const ProtocolToolbar = ({
  status,
  onClear,
  onOpenRegistry,
  onSave,
  pageCount,
  onPrintPage,
}: Props) => (
  <div className="toolbar-wrap">
    <div className="print-actions" aria-label="Панель действий">
      <button type="button" className="clear-button" onClick={onClear}>
        Очистить бланк
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
  </div>
);
