import { useLayoutEffect, useRef, useState, type MouseEvent } from 'react';
import { readCurrentRecipient } from '../../storage/repositories/current-recipient';
import type {
  RecipientRecord,
  RegistrationRecord,
} from '../../storage/repositories/recipients';
import { FirstPage } from './first-page';
import {
  PROTOCOL_CHUNK_ORDER,
  type ProtocolChunkId,
} from './protocol-pagination';
import { ProtocolEditorModal } from './protocol-editor-modal';
import { ProtocolToolbar } from './protocol-toolbar';
import { RecipientDatabaseModal } from './recipient-database-modal';
import { ContinuationPage } from './second-page';
import { useProtocolWorkspace } from './use-protocol-workspace';

const INITIAL_PAGES: ProtocolChunkId[][] = [
  PROTOCOL_CHUNK_ORDER.slice(0, 9),
  PROTOCOL_CHUNK_ORDER.slice(9),
];

const PAGE_FIT_TOLERANCE_PX = 2;
const PENDING_REGISTRATION_RECORD_KEY = 'blood:registration-open-record';

const samePages = (left: ProtocolChunkId[][], right: ProtocolChunkId[][]) =>
  left.length === right.length &&
  left.every(
    (page, pageIndex) =>
      page.length === right[pageIndex]?.length &&
      page.every((chunkId, chunkIndex) => chunkId === right[pageIndex][chunkIndex]),
  );

export const TransfusionProtocol = () => {
  const workspace = useProtocolWorkspace();
  const sheetsRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<ProtocolChunkId[][]>(INITIAL_PAGES);
  const [registryRecipientId, setRegistryRecipientId] = useState<number | null>(null);

  useLayoutEffect(() => {
    const sheets = sheetsRef.current;
    if (!sheets) return undefined;

    const updatePagination = () => {
      const firstSheet = sheets.querySelector<HTMLElement>('.sheet--first');
      const continuationSheet = sheets.querySelector<HTMLElement>('.sheet--continuation');
      if (!firstSheet || !continuationSheet) return;

      const chunks = new Map<ProtocolChunkId, HTMLElement>();
      sheets.querySelectorAll<HTMLElement>('[data-protocol-chunk]').forEach((element) => {
        const chunkId = element.dataset.protocolChunk as ProtocolChunkId | undefined;
        if (chunkId) chunks.set(chunkId, element);
      });

      const firstChunk = chunks.get(PROTOCOL_CHUNK_ORDER[0]);
      if (!firstChunk || chunks.size !== PROTOCOL_CHUNK_ORDER.length) return;

      const firstStyle = window.getComputedStyle(firstSheet);
      const continuationStyle = window.getComputedStyle(continuationSheet);
      const firstZoom = Number.parseFloat(firstStyle.getPropertyValue('zoom')) || 1;
      const continuationZoom =
        Number.parseFloat(continuationStyle.getPropertyValue('zoom')) || 1;

      const firstPaddingBottom = Number.parseFloat(firstStyle.paddingBottom) * firstZoom;
      const firstCapacity =
        firstSheet.getBoundingClientRect().bottom -
        firstPaddingBottom -
        firstChunk.getBoundingClientRect().top;

      const continuationCapacity =
        (continuationSheet.clientHeight -
          Number.parseFloat(continuationStyle.paddingTop) -
          Number.parseFloat(continuationStyle.paddingBottom)) *
        continuationZoom;

      if (firstCapacity <= 0 || continuationCapacity <= 0) return;

      const nextPages: ProtocolChunkId[][] = [];
      let currentPage: ProtocolChunkId[] = [];
      let currentHeight = 0;
      let currentCapacity = firstCapacity;

      PROTOCOL_CHUNK_ORDER.forEach((chunkId) => {
        const chunk = chunks.get(chunkId);
        if (!chunk) return;

        const chunkHeight = chunk.getBoundingClientRect().height;
        const fitsCurrentPage =
          currentPage.length === 0 ||
          currentHeight + chunkHeight <= currentCapacity + PAGE_FIT_TOLERANCE_PX;

        if (!fitsCurrentPage) {
          nextPages.push(currentPage);
          currentPage = [];
          currentHeight = 0;
          currentCapacity = continuationCapacity;
        }

        currentPage.push(chunkId);
        currentHeight += chunkHeight;
      });

      if (currentPage.length) nextPages.push(currentPage);
      if (nextPages.length === 1) nextPages.push([]);

      setPages((current) => (samePages(current, nextPages) ? current : nextPages));
    };

    updatePagination();

    const observer = new ResizeObserver(updatePagination);
    sheets
      .querySelectorAll<HTMLElement>('.sheet, [data-protocol-chunk]')
      .forEach((element) => observer.observe(element));

    window.addEventListener('resize', updatePagination);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updatePagination);
    };
  }, [pages]);

  const clearHoveredBlock = () => {
    sheetsRef.current
      ?.querySelectorAll<HTMLElement>('[data-protocol-block].is-logical-hovered')
      .forEach((element) => element.classList.remove('is-logical-hovered'));
  };

  const highlightHoveredBlock = (blockId: string) => {
    clearHoveredBlock();
    sheetsRef.current
      ?.querySelectorAll<HTMLElement>('[data-protocol-block]')
      .forEach((element) => {
        if (element.dataset.protocolBlock === blockId) {
          element.classList.add('is-logical-hovered');
        }
      });
  };

  const handleSheetsMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    const element = event.target as HTMLElement;
    const cell = element.closest<HTMLElement>('th, td');
    const block = cell?.closest<HTMLElement>('[data-protocol-block]');

    if (block?.dataset.protocolBlock) {
      highlightHoveredBlock(block.dataset.protocolBlock);
      return;
    }

    clearHoveredBlock();
  };

  const openRegistrationRecord = async (
    record: RegistrationRecord,
    recipient: RecipientRecord,
  ) => {
    const switched = await workspace.selectRecipient(recipient);
    if (!switched) return;

    try {
      window.sessionStorage.setItem(
        PENDING_REGISTRATION_RECORD_KEY,
        JSON.stringify({
          ...record,
          values: {
            ...record.values,
            recipientId: String(record.recipientId),
          },
        }),
      );
    } catch (error) {
      console.error('Не удалось подготовить лист регистрации к открытию:', error);
      return;
    }

    setRegistryRecipientId(null);
    workspace.setRegistryOpen(false);
    window.location.hash = '#/registration';
  };

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
        warning={workspace.reagentWarning}
        dangerWarning={workspace.compatibilityWarning}
        bloodGroupWarning={workspace.bloodGroupWarning}
        onDismissBloodGroupWarning={workspace.dismissBloodGroupWarning}
        componentUnitNumberWarning={workspace.componentUnitNumberWarning}
        onDismissComponentUnitNumberWarning={workspace.dismissComponentUnitNumberWarning}
        onClear={workspace.clearForm}
        onNew={() => void workspace.newBlank()}
        onOpenRegistry={() => {
          const currentRecipient = readCurrentRecipient();
          const formRecipientId = Number(workspace.values.recipientId);
          setRegistryRecipientId(
            currentRecipient?.id ??
              (Number.isFinite(formRecipientId) && formRecipientId > 0
                ? formRecipientId
                : null),
          );
          workspace.setRegistryOpen(true);
        }}
        currentRecipientName={workspace.values.recipientName ?? ''}
        currentRecipientAbo={workspace.values.recipientAbo ?? ''}
        currentRecipientRh={workspace.values.recipientRh ?? ''}
        currentRecipientAvailable={
          Number.isFinite(Number(workspace.values.recipientId)) &&
          Number(workspace.values.recipientId) > 0
        }
        onOpenCurrentRecipient={() => {
          const recipientId = Number(workspace.values.recipientId);
          if (!Number.isFinite(recipientId) || recipientId <= 0) return;
          setRegistryRecipientId(recipientId);
          workspace.setRegistryOpen(true);
        }}
        onSave={() => void workspace.saveToDatabase()}
        pageCount={pages.length}
        onPrintPage={printPage}
      />

      <div
        ref={sheetsRef}
        className="sheets"
        onMouseMove={handleSheetsMouseMove}
        onMouseLeave={clearHoveredBlock}
      >
        <FirstPage
          values={workspace.values}
          onOpenBlock={workspace.setActiveBlock}
          chunkIds={pages[0] ?? []}
        />
        {pages.slice(1).map((chunkIds, index) => (
          <ContinuationPage
            key={index + 2}
            pageNumber={index + 2}
            values={workspace.values}
            onOpenBlock={workspace.setActiveBlock}
            chunkIds={chunkIds}
          />
        ))}
      </div>

      {workspace.activeBlock && (
        <ProtocolEditorModal
          key={workspace.activeBlock}
          blockId={workspace.activeBlock}
          values={workspace.values}
          bloodGroupWarning={workspace.bloodGroupWarning}
          onDismissBloodGroupWarning={workspace.dismissBloodGroupWarning}
          componentUnitNumberWarning={workspace.componentUnitNumberWarning}
          onDismissComponentUnitNumberWarning={workspace.dismissComponentUnitNumberWarning}
          previousTransfusionSuggestion={workspace.previousTransfusionSuggestion}
          persistReusableOptions={workspace.recordId === null}
          onOpenRecipients={() => {
            const currentRecipient = readCurrentRecipient();
            const formRecipientId = Number(workspace.values.recipientId);
            setRegistryRecipientId(
              currentRecipient?.id ??
                (Number.isFinite(formRecipientId) && formRecipientId > 0
                  ? formRecipientId
                  : null),
            );
            workspace.setActiveBlock(null);
            workspace.setRegistryOpen(true);
          }}
          onSelectRecipient={workspace.selectRecipient}
          onSave={workspace.saveValues}
          onClose={(draftValues) => {
            if (workspace.activeBlock === 'donor') {
              workspace.validateComponentUnitNumber(draftValues);
            }
            workspace.setActiveBlock(null);
          }}
        />
      )}

      {workspace.registryOpen && (
        <RecipientDatabaseModal
          initialRecipientId={registryRecipientId}
          initialRecipientName={
            readCurrentRecipient()?.fullName ??
            workspace.values.recipientName ??
            ''
          }
          onClose={() => {
            setRegistryRecipientId(null);
            workspace.setRegistryOpen(false);
          }}
          onOpenRecord={workspace.openRecord}
          onOpenRegistrationRecord={(record, recipient) =>
            void openRegistrationRecord(record, recipient)
          }
          onUseRecipient={workspace.selectRecipient}
        />
      )}
    </main>
  );
};
