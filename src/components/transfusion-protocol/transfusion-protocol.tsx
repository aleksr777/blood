import { useLayoutEffect, useRef, useState } from 'react';
import { FirstPage } from './first-page';
import { ProtocolEditorModal } from './protocol-editor-modal';
import { ProtocolToolbar } from './protocol-toolbar';
import { RecipientDatabaseModal } from './recipient-database-modal';
import { SecondPage } from './second-page';
import type { ProtocolBlockId } from './protocol-types';
import { useProtocolWorkspace } from './use-protocol-workspace';

type PrintPage = 'first' | 'second';

const PROTOCOL_BLOCK_ORDER: ProtocolBlockId[] = [
  'general',
  'examination',
  'indications',
  'history',
  'donor',
  'selection',
  'compatibilityTests',
  'complications',
  'monitoring',
  'doctor',
];

const INITIAL_FIRST_PAGE_BLOCK_COUNT = 5;
const PAGE_FIT_TOLERANCE_PX = 2;

export const TransfusionProtocol = () => {
  const workspace = useProtocolWorkspace();
  const sheetsRef = useRef<HTMLDivElement>(null);
  const [firstPageBlockCount, setFirstPageBlockCount] = useState(
    INITIAL_FIRST_PAGE_BLOCK_COUNT,
  );

  useLayoutEffect(() => {
    const sheets = sheetsRef.current;
    if (!sheets) return undefined;

    const updatePagination = () => {
      const firstSheet = sheets.querySelector<HTMLElement>('.sheet--first');
      if (!firstSheet) return;

      const blocks = new Map<ProtocolBlockId, HTMLElement>();
      sheets.querySelectorAll<HTMLElement>('[data-protocol-block]').forEach((element) => {
        const blockId = element.dataset.protocolBlock as ProtocolBlockId | undefined;
        if (blockId) blocks.set(blockId, element);
      });

      const firstBlock = blocks.get(PROTOCOL_BLOCK_ORDER[0]);
      if (!firstBlock) return;

      const sheetStyle = window.getComputedStyle(firstSheet);
      const zoom = Number.parseFloat(sheetStyle.zoom) || 1;
      const paddingBottom = Number.parseFloat(sheetStyle.paddingBottom) * zoom;
      const sheetBottom = firstSheet.getBoundingClientRect().bottom - paddingBottom;
      const blocksTop = firstBlock.getBoundingClientRect().top;
      const availableHeight = sheetBottom - blocksTop;

      let usedHeight = 0;
      let nextCount = 0;

      for (const blockId of PROTOCOL_BLOCK_ORDER) {
        const block = blocks.get(blockId);
        if (!block) continue;

        const blockHeight = block.getBoundingClientRect().height;
        const fits =
          nextCount === 0 ||
          usedHeight + blockHeight <= availableHeight + PAGE_FIT_TOLERANCE_PX;

        if (!fits) break;
        usedHeight += blockHeight;
        nextCount += 1;
      }

      nextCount = Math.max(1, nextCount);
      setFirstPageBlockCount((current) => (current === nextCount ? current : nextCount));
    };

    updatePagination();

    const observer = new ResizeObserver(updatePagination);
    sheets.querySelectorAll<HTMLElement>('.sheet, [data-protocol-block]').forEach((element) => {
      observer.observe(element);
    });

    window.addEventListener('resize', updatePagination);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updatePagination);
    };
  }, [workspace.values, firstPageBlockCount]);

  const firstPageBlocks = PROTOCOL_BLOCK_ORDER.slice(0, firstPageBlockCount);
  const secondPageBlocks = PROTOCOL_BLOCK_ORDER.slice(firstPageBlockCount);

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

      <div ref={sheetsRef} className="sheets">
        <FirstPage
          values={workspace.values}
          onOpenBlock={workspace.setActiveBlock}
          blockIds={firstPageBlocks}
        />
        <SecondPage
          values={workspace.values}
          onOpenBlock={workspace.setActiveBlock}
          blockIds={secondPageBlocks}
        />
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
