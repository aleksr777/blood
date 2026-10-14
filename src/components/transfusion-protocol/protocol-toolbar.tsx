import { SiteNavigation } from '../site-navigation/site-navigation';

type Props = {
  status: string;
  warning: string;
  dangerWarning: string;
  bloodGroupWarning: string;
  onDismissBloodGroupWarning: () => void;
  componentUnitNumberWarning: string;
  onDismissComponentUnitNumberWarning: () => void;
  onClear: () => void;
  onNew: () => void;
  onOpenRegistry: () => void;
  onOpenCurrentRecipient: () => void;
  currentRecipientName: string;
  currentRecipientAvailable: boolean;
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
  componentUnitNumberWarning,
  onDismissComponentUnitNumberWarning,
  onClear,
  onNew,
  onOpenRegistry,
  onOpenCurrentRecipient,
  currentRecipientName,
  currentRecipientAvailable,
  onSave,
  pageCount,
  onPrintPage,
}: Props) => (
  <header className="app-header">
    <div className="toolbar-wrap">
    <SiteNavigation current="protocol" />
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
      <button
        type="button"
        className="secondary-button"
        disabled={!currentRecipientAvailable}
        title={currentRecipientAvailable ? currentRecipientName : 'Текущий реципиент не выбран'}
        onClick={onOpenCurrentRecipient}
      >
        Текущий реципиент
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
    {componentUnitNumberWarning && (
      <div className="toolbar-component-unit-warning" role="alert">
        <span>{componentUnitNumberWarning}</span>
        <button
          type="button"
          className="toolbar-warning-dismiss"
          aria-label="Закрыть предупреждение"
          onClick={onDismissComponentUnitNumberWarning}
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
