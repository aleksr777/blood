import ui from '../../styles/ui';
import { useEffect, useState } from 'react';
import { SiteNavigation } from '../site-navigation/site-navigation';

type Props = {
  status: string;
  warning: string;
  hemaconWarning: string;
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
  currentRecipientAbo: string;
  currentRecipientRh: string;
  currentRecipientAvailable: boolean;
  onSave: () => void;
  pageCount: number;
  onPrintPage: (pageIndex: number) => void;
};

export const ProtocolToolbar = ({
  status,
  warning,
  hemaconWarning,
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
  currentRecipientAbo,
  currentRecipientRh,
  currentRecipientAvailable,
  onSave,
  pageCount,
  onPrintPage,
}: Props) => {
  const [hemaconWarningVisible, setHemaconWarningVisible] = useState(false);

  useEffect(() => {
    if (!hemaconWarning) setHemaconWarningVisible(false);
  }, [hemaconWarning]);

  const runHemaconAction = (action: () => void) => {
    if (hemaconWarning) {
      setHemaconWarningVisible(true);
      return;
    }
    action();
  };

  return (
    <header className="app-header">
      <div className="toolbar-wrap">
        <SiteNavigation
          current="protocol"
          recipientName={currentRecipientName}
          recipientAbo={currentRecipientAbo}
          recipientRh={currentRecipientRh}
          currentRecipientAvailable={currentRecipientAvailable}
          onOpenCurrentRecipient={onOpenCurrentRecipient}
        />
        <div className="print-actions" aria-label="Панель действий">
          <button
            type="button"
            className={`${ui.dangerButton} ${ui.toolbarButton} clear-button`}
            onClick={onClear}
          >
            Очистить бланк
          </button>
          <button
            type="button"
            className={`${ui.secondaryButton} ${ui.toolbarButton} new-button`}
            onClick={onNew}
          >
            Новый бланк
          </button>
          <button
            type="button"
            className={`${ui.secondaryButton} ${ui.toolbarButton} secondary-button`}
            onClick={onOpenRegistry}
          >
            Реципиенты
          </button>
          <button
            type="button"
            className={`${ui.successButton} ${ui.toolbarButton} save-button`}
            onClick={() => runHemaconAction(onSave)}
            aria-disabled={Boolean(hemaconWarning)}
          >
            Сохранить
          </button>
          {Array.from({ length: pageCount }, (_, pageIndex) => (
            <button
              key={pageIndex}
              type="button"
              className={`${ui.primaryButton} ${ui.toolbarButton} print-button`}
              onClick={() => runHemaconAction(() => onPrintPage(pageIndex))}
              aria-disabled={Boolean(hemaconWarning)}
            >
              Печать страницы {pageIndex + 1}
            </button>
          ))}
        </div>
        {hemaconWarningVisible && hemaconWarning && (
          <div className={`${ui.warningNotice} toolbar-warning`} role="alert">
            {hemaconWarning}
          </div>
        )}
        {status && (
          <div className="toolbar-status" role="status">
            {status}
          </div>
        )}
        {dangerWarning && (
          <div className={`${ui.dangerNotice} toolbar-danger-warning`} role="alert">
            {dangerWarning}
          </div>
        )}
        {bloodGroupWarning && (
          <div className={`${ui.warningNotice} toolbar-blood-group-warning`} role="alert">
            <span>{bloodGroupWarning}</span>
            <button
              type="button"
              className={`${ui.iconButton} toolbar-warning-dismiss`}
              aria-label="Закрыть предупреждение"
              onClick={onDismissBloodGroupWarning}
            >
              ×
            </button>
          </div>
        )}
        {componentUnitNumberWarning && (
          <div className={`${ui.warningNotice} toolbar-component-unit-warning`} role="alert">
            <span>{componentUnitNumberWarning}</span>
            <button
              type="button"
              className={`${ui.iconButton} toolbar-warning-dismiss`}
              aria-label="Закрыть предупреждение"
              onClick={onDismissComponentUnitNumberWarning}
            >
              ×
            </button>
          </div>
        )}
        {warning && (
          <div className={`${ui.warningNotice} toolbar-warning`} role="alert">
            {warning}
          </div>
        )}
      </div>
    </header>
  );
};
