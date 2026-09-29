import { FirstPage } from './first-page';
import { ProtocolEditorModal } from './protocol-editor-modal';
import { ProtocolToolbar } from './protocol-toolbar';
import { RecipientDatabaseModal } from './recipient-database-modal';
import { SecondPage } from './second-page';
import { useProtocolWorkspace } from './use-protocol-workspace';

type PrintPage = 'first' | 'second';

export const TransfusionProtocol = () => {
  const workspace = useProtocolWorkspace();

  const printPage = (page: PrintPage) => {
    const root = document.documentElement;
    const afterPrint = () => {
      delete root.dataset.printPage;
      window.removeEventListener('afterprint', afterPrint);
      void workspace.saveToDatabase(true);
    };

    root.dataset.printPage = page;
    window.addEventListener('afterprint', afterPrint);
    window.print();
  };

  return (
    <main className="app-shell">
      <ProtocolToolbar
        status={workspace.status}
        onClear={workspace.clearForm}
        onOpenRegistry={() => workspace.setRegistryOpen(true)}
        onSave={() => void workspace.saveToDatabase()}
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
          onClose={() => workspace.setActiveBlock(null)}
        />
      )}

      {workspace.registryOpen && (
        <RecipientDatabaseModal
          onClose={() => workspace.setRegistryOpen(false)}
          onOpenRecord={workspace.openRecord}
        />
      )}
    </main>
  );
};
