type Props = {
  editingSaved: boolean;
  status: string;
  onClear: () => void;
  onOpenRegistry: () => void;
  onSaveDatabase: () => void;
  onPrintFirst: () => void;
  onPrintSecond: () => void;
};

export const ProtocolToolbar = ({
  editingSaved,
  status,
  onClear,
  onOpenRegistry,
  onSaveDatabase,
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
      <button type="button" className="save-button" onClick={onSaveDatabase}>
        {editingSaved ? 'Сохранить изменения' : 'Сохранить в базу'}
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
