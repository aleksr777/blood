import { useState } from 'react';
import { FirstPage } from './first-page';
import { ProtocolEditorModal } from './protocol-editor-modal';
import { SecondPage } from './second-page';
import type { ProtocolBlockId, ProtocolValues } from './protocol-types';

type PrintPage = 'first' | 'second';

export const TransfusionProtocol = () => {
  const [values, setValues] = useState<ProtocolValues>({});
  const [activeBlock, setActiveBlock] = useState<ProtocolBlockId | null>(null);

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

  const saveBlock = (nextValues: ProtocolValues) => {
    setValues((current) => ({ ...current, ...nextValues }));
  };

  return (
    <main className="app-shell">
      <div className="print-actions" aria-label="Панель печати">
        <button type="button" className="print-button" onClick={() => printPage('first')}>
          Печать страницы 1
        </button>
        <button type="button" className="print-button" onClick={() => printPage('second')}>
          Печать страницы 2
        </button>
      </div>

      <div className="sheets">
        <FirstPage values={values} onOpenBlock={setActiveBlock} />
        <SecondPage values={values} onOpenBlock={setActiveBlock} />
      </div>

      {activeBlock && (
        <ProtocolEditorModal
          key={activeBlock}
          blockId={activeBlock}
          values={values}
          onSave={saveBlock}
          onClose={() => setActiveBlock(null)}
        />
      )}
    </main>
  );
};
