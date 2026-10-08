import { useLayoutEffect, useRef, useState } from 'react';
import { FirstPage } from './first-page';
import { ProtocolEditorModal } from './protocol-editor-modal';
import { ProtocolToolbar } from './protocol-toolbar';
import { RecipientDatabaseModal } from './recipient-database-modal';
import { ContinuationPage } from './second-page';
import type { ProtocolBlockId } from './protocol-types';
import { useProtocolWorkspace } from './use-protocol-workspace';

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

const INITIAL_PAGES: ProtocolBlockId[][] = [
  PROTOCOL_BLOCK_ORDER.slice(0, 5),
  PROTOCOL_BLOCK_ORDER.slice(5),
];

const PAGE_FIT_TOLERANCE_PX = 2;

const samePages = (left: ProtocolBlockId[][], right: ProtocolBlockId[][]) =>
  left.length === right.length &&
  left.every(
    (page, pageIndex) =>
      page.length === right[pageIndex]?.length &&
      page.every((blockId, blockIndex) => blockId === right[pageIndex][blockIndex]),
  );

export const TransfusionProtocol = () => {
  const workspace = useProtocolWorkspace();
  const sheetsRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<ProtocolBlockId[][]>(INITIAL_PAGES);

  useLayoutEffect(() => {
    const sheets = sheetsRef.current;
    if (!sheets) return undefined;

    const updatePagination = () => {
      const firstSheet = sheets.querySelector<HTMLElement>('.sheet--first');
      const continuationSheet = sheets.querySelector<HTMLElement>('.sheet--continuation');
      if (!firstSheet || !continuationSheet) return;

      const blocks = new Map<ProtocolBlockId, HTMLElement>();
      sheets.querySelectorAll<HTMLElement>('[data-protocol-block]').forEach((element) => {
        const blockId = element.dataset.protocolBlock as ProtocolBlockId | undefined;
        if (blockId) blocks.set(blockId, element);
      });

      const firstBlock = blocks.get(PROTOCOL_BLOCK_ORDER[0]);
      if (!firstBlock || blocks.size !== PROTOCOL_BLOCK_ORDER.length) return;

      const firstStyle = window.getComputedStyle(firstSheet);
      const continuationStyle = window.getComputedStyle(continuationSheet);
      const firstZoom = Number.parseFloat(firstStyle.getPropertyValue('zoom')) || 1;
      const continuationZoom =
        Number.parseFloat(continuationStyle.getPropertyValue('zoom')) || 1;

      const firstPaddingBottom = Number.parseFloat(firstStyle.paddingBottom) * firstZoom;
      const firstCapacity =
        firstSheet.getBoundingClientRect().bottom -
        firstPaddingBottom -
        firstBlock.getBoundingClientRect().top;

      const continuationCapacity =
        (continuationSheet.clientHeight -
          Number.parseFloat(continuationStyle.paddingTop) -
          Number.parseFloat(continuationStyle.paddingBottom)) *
        continuationZoom;

      if (firstCapacity <= 0 || continuationCapacity <= 0) return;

      const nextPages: ProtocolBlockId[][] = [];
      let currentPage: ProtocolBlockId[] = [];
      let currentHeight = 0;
      let currentCapacity = firstCapacity;

      PROTOCOL_BLOCK_ORDER.forEach((blockId) => {
        const block = blocks.get(blockId);
        if (!block) return;

        const blockHeight = block.getBoundingClientRect().height;
        const fitsCurrentPage =
          currentPage.length === 0 ||
          currentHeight + blockHeight <= currentCapacity + PAGE_FIT_TOLERANCE_PX;

        if (!fitsCurrentPage) {
          nextPages.push(currentPage);
          currentPage = [];
          currentHeight = 0;
          currentCapacity = continuationCapacity;
        }

        currentPage.push(blockId);
        currentHeight += blockHeight;
      });

      if (currentPage.length) nextPages.push(currentPage);

      // Keep a continuation sheet available for measurement and for the
      // protocol's normal two-page layout even if all blocks happen to fit.
      if (nextPages.length === 1) nextPages.push([]);

      setPages((current) => (samePages(current, nextPages) ? current : nextPages));
    };

    updatePagination();

    const observer = new ResizeObserver(updatePagination);
    sheets
      .querySelectorAll<HTMLElement>('.sheet, [data-protocol-block]')
      .forEach((element) => observer.observe(element));

    window.addEventListener('resize', updatePagination);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updatePagination);
    };
  }, [pages]);

  const printPage = (pageIndex: number) => {
    const root = document.documentElement;
    const sheetElements = Array.from(
      document.querySelectorAll<HTMLElement>('.sheets .sheet'),
    );

    sheetElements.forEach((sheet, index) => {
      if (index !== pageIndex) sheet.dataset.printHidden = 'true';
    });

    const afterPrint = () => {
      delete root.dataset.printPage;
      sheetElements.forEach((sheet) => delete sheet.dataset.printHidden);
      window.removeEventListener('afterprint', afterPrint);
      void workspace.saveToDatabase(true);
    };

    root.dataset.printPage = String(pageIndex + 1);
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
        pageCount={pages.length}
        onPrintPage={printPage}
      />

      <div ref={sheetsRef} className="sheets">
        <FirstPage
          values={workspace.values}
          onOpenBlock={workspace.setActiveBlock}
          blockIds={pages[0] ?? []}
        />
        {pages.slice(1).map((blockIds, index) => (
          <ContinuationPage
            key={index + 2}
            pageNumber={index + 2}
            values={workspace.values}
            onOpenBlock={workspace.setActiveBlock}
            blockIds={blockIds}
          />
        ))}
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
