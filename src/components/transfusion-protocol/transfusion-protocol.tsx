import { FirstPage } from './first-page';
import { ProtocolEditorModal } from './protocol-editor-modal';
import { ProtocolToolbar } from './protocol-toolbar';
import { RecipientDatabaseModal } from './recipient-database-modal';
import { RecipientMatchModal } from './recipient-match-modal';
import { SecondPage } from './second-page';
import { useProtocolWorkspace } from './use-protocol-workspace';

type PrintPage = 'first' | 'second';

export const TransfusionProtocol = () => {
  const workspace = useProtocolWorkspace();

  const printPage = (page: PrintPage) => {
    const root = document.documentElement;
    const cleanup = () => {
      delete root.dataset.printPage;
      window.removeEventListener('afterprint', cleanup);
    };

    root.dataset.printPage = page;
    window.addEventListener('afterprint', cleanup);
    window.print();
  };

  return (
    <main className="app-shell">
      <ProtocolToolbar
        status={workspace.status}
        onClear={workspace.clearForm}
        onOpenRegistry={() => workspace.setRegistryOpen(true)}
        onPrintFirst={() => printPage('first')}
        onPrintSecond={() => printPage('second')}
      />

      <div className="sheets">
        <FirstPage values={workspace.values} onOpenBlock={workspace.setActiveBlock} />
        <SecondPage values={workspace.values} onOpenBlock={workspace.setActiveBlock} />
      </div>

      {workspace.activeBlock && (
        <ProtocolEditorModal
          key={workspace.activeBlock}
          blockId={workspace.activeBlock}
          values={workspace.values}
          onSave={workspace.saveValues}
          onFieldBlur={workspace.handleFieldBlur}
          onClose={() => workspace.setActiveBlock(null)}
        />
      )}

      {workspace.recipientMatch && (
        <RecipientMatchModal
          recipient={workspace.recipientMatch}
          onApply={workspace.applyRecipientData}
          onDismiss={workspace.dismissRecipientMatch}
        />
      )}

      {workspace.registryOpen && (
        <RecipientDatabaseModal
          onClose={() => workspace.setRegistryOpen(false)}
          onOpenRecord={workspace.openRecord}
          onNewProtocol={workspace.newForRecipient}
        />
      )}
    </main>
  );
};
