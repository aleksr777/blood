import { AnimatedMessage } from '../animated-reveal/animated-message';
import ui from '../../styles/ui';
import { useEffect, useState } from 'react';
import { SiteNavigation } from '../site-navigation/site-navigation';
import { WarningNotice } from '../warning-notice/warning-notice';
import { SavedDocumentBar } from '../saved-document/saved-document-bar';
import type { SavedDocumentControls } from '../saved-document/use-document-state';

type Props = {
  document?: SavedDocumentControls;
  documentTitle?: string;
  onReturnToList?: () => void;
  status: string;
  warning: string;
  hemaconWarning: string;
  hemaconDateWarning: string;
  dangerWarning: string;
  bloodGroupWarning: string;
  bloodGroupWarningDismissible: boolean;
  onDismissBloodGroupWarning: () => void;
  componentUnitNumberWarning: string;
  onDismissComponentUnitNumberWarning: () => void;
  onClear: () => void;
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
  document,
  documentTitle = 'Протокол трансфузии',
  onReturnToList,
  status,
  warning,
  hemaconWarning,
  hemaconDateWarning,
  dangerWarning,
  bloodGroupWarning,
  bloodGroupWarningDismissible,
  onDismissBloodGroupWarning,
  componentUnitNumberWarning,
  onDismissComponentUnitNumberWarning,
  onClear,
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
  const [showHemaconWarning, setShowHemaconWarning] = useState(false);
  const visibleWarning = showHemaconWarning ? hemaconWarning : '';

  useEffect(() => {
    if (!visibleWarning) setShowHemaconWarning(false);
  }, [visibleWarning]);

  const runValidatedAction = (action: () => void) => {
    if (hemaconWarning) {
      setShowHemaconWarning(true);
      return;
    }
    setShowHemaconWarning(false);
    action();
  };

  return (
    <header className="app-header">
      <div className="toolbar-wrap">
        <SiteNavigation
          current="protocol"
          showRecipient={!document?.record}
          recipientName={currentRecipientName}
          recipientAbo={currentRecipientAbo}
          recipientRh={currentRecipientRh}
          currentRecipientAvailable={currentRecipientAvailable}
          onOpenCurrentRecipient={onOpenCurrentRecipient}
        />
        {document && (
          <SavedDocumentBar
            document={document}
            title={documentTitle}
            onReturnToList={onReturnToList}
          />
        )}
        <div className="print-actions" aria-label="Панель действий">
          {!document?.record && (
            <>
              <button
                type="button"
                className={`${ui.dangerButton} ${ui.toolbarButton} clear-button`}
                onClick={onClear}
              >
                Очистить бланк
              </button>
            </>
          )}
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
            onClick={() => runValidatedAction(onSave)}
            disabled={document?.mode === 'view'}
            aria-disabled={Boolean(hemaconWarning)}
          >
            {document?.mode === 'edit' ? 'Сохранить изменения' : 'Сохранить'}
          </button>
          {Array.from({ length: pageCount }, (_, pageIndex) => (
            <button
              key={pageIndex}
              type="button"
              className={`${ui.primaryButton} ${ui.toolbarButton} print-button`}
              onClick={() => runValidatedAction(() => onPrintPage(pageIndex))}
              aria-disabled={Boolean(hemaconWarning)}
            >
              Печать страницы {pageIndex + 1}
            </button>
          ))}
        </div>
        <WarningNotice
          className="toolbar-warning"
          message={visibleWarning}
          onDismiss={() => setShowHemaconWarning(false)}
        />
        <WarningNotice
          className="toolbar-warning"
          message={hemaconDateWarning}
          dismissible={false}
        />
        <AnimatedMessage message={status} className="toolbar-status" />
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
        <WarningNotice className="toolbar-warning" message={document?.record ? '' : warning} />
      </div>
    </header>
  );
};
