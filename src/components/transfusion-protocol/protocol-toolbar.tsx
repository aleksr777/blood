import ui from '../../styles/ui';
import { useEffect, useState } from 'react';
import { SiteNavigation } from '../site-navigation/site-navigation';
import { WarningNotice } from '../warning-notice/warning-notice';

type Props = {
  status: string;
  warning: string;
  hemaconWarning: string;
  dangerWarning: string;
  bloodGroupWarning: string;
  bloodGroupWarningDismissible: boolean;
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
  bloodGroupWarningDismissible,
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
          <WarningNotice
            className="toolbar-warning"
            message={hemaconWarning}
            onDismiss={() => setHemaconWarningVisible(false)}
          />
        )}
        {status && (
          <div className="toolbar-status" role="status">
            {status}
          </div>
        )}
        <WarningNotice className="toolbar-danger-warning" message={dangerWarning} danger />
        <WarningNotice
          className="toolbar-blood-group-warning"
          message={bloodGroupWarning}
          dismissible={bloodGroupWarningDismissible}
          onDismiss={onDismissBloodGroupWarning}
        />
        <WarningNotice
          className="toolbar-component-unit-warning"
          message={componentUnitNumberWarning}
          onDismiss={onDismissComponentUnitNumberWarning}
        />
        <WarningNotice className="toolbar-warning" message={warning} />
      </div>
    </header>
  );
};
