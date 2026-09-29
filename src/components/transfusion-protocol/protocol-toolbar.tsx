type Props = {
  status: string;
  onClear: () => void;
  onOpenRegistry: () => void;
  onSave: () => void;
  onPrintFirst: () => void;
  onPrintSecond: () => void;
};

export const ProtocolToolbar = ({
  status,
  onClear,
  onOpenRegistry,
  onSave,
  onPrintFirst,
  onPrintSecond,
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
      <button type="button" className="print-button" onClick={onPrintFirst}>
        Печать страницы 1
      </button>
      <button type="button" className="print-button" onClick={onPrintSecond}>
        Печать страницы 2
      </button>
    </div>
    {status && (
      <div className="toolbar-status" role="status">
        {status}
      </div>
    )}
  </div>
);
