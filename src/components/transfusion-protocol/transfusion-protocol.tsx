import { useEffect, useState } from 'react';
import {
  clearProtocolDraft,
  loadProtocolDraft,
  saveProtocolDraft,
} from '../../storage/repositories/protocol-draft';
import { FirstPage } from './first-page';
import { ProtocolEditorModal } from './protocol-editor-modal';
import { SecondPage } from './second-page';
import type { ProtocolBlockId, ProtocolValues } from './protocol-types';

type PrintPage = 'first' | 'second';

export const TransfusionProtocol = () => {
  const [values, setValues] = useState<ProtocolValues>({});
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [activeBlock, setActiveBlock] = useState<ProtocolBlockId | null>(null);

  useEffect(() => {
    let active = true;

    void loadProtocolDraft()
      .then((storedValues) => {
        if (active) setValues((current) => ({ ...storedValues, ...current }));
      })
      .catch((error: unknown) => {
        console.error('Не удалось загрузить сохранённый бланк:', error);
      })
      .finally(() => {
        if (active) setDraftLoaded(true);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!draftLoaded) return;
    void saveProtocolDraft(values).catch((error: unknown) => {
      console.error('Не удалось сохранить бланк:', error);
    });
  }, [draftLoaded, values]);

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

  const clearForm = () => {
    setActiveBlock(null);
    setValues({});
    void clearProtocolDraft().catch((error: unknown) => {
      console.error('Не удалось очистить сохранённый бланк:', error);
    });
  };

  return (
    <main className="app-shell">
      <div className="print-actions" aria-label="Панель действий">
        <button type="button" className="clear-button" onClick={clearForm}>
          Очистить бланк
        </button>
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
