// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { DONOR_COMPONENT_TITLE } from './editor-config';
import { ProtocolBlocks } from './protocol-blocks';
import { getChunkBlockId, PROTOCOL_CHUNK_ORDER } from './protocol-pagination';

afterEach(cleanup);
const values = {
  previousTransfusionsStatus: 'had',
  previousTransfusions: 'Анамнез без потери данных',
  componentGroup: 'erythrocytes',
  indicationComponent: 'erythrocytes',
  indicationRbcHemicHypoxia: '1',
  componentName: 'Отмытые эритроциты',
  componentUnitNumber: '76102200045636',
  donorAbo: 'A(II)',
  donorRh: 'Rh(+)',
  amountMl: '250',
  collectionDate: '2026-10-01',
  expirationDate: '2026-12-31',
};

it('renders separate indication and donor headings after history with one logical editor', () => {
  const { container } = render(
    <table>
      <ProtocolBlocks chunkIds={PROTOCOL_CHUNK_ORDER} values={values} onOpenBlock={vi.fn()} />
    </table>,
  );
  const chunks = [...container.querySelectorAll<HTMLElement>('[data-protocol-chunk]')];
  expect(chunks.map((chunk) => chunk.dataset.protocolChunk)).toEqual(PROTOCOL_CHUNK_ORDER);
  expect(chunks.findIndex((chunk) => chunk.dataset.protocolBlock === 'history')).toBeLessThan(
    chunks.findIndex((chunk) => chunk.dataset.protocolBlock === 'donor'),
  );
  expect(screen.queryByRole('columnheader', { name: DONOR_COMPONENT_TITLE })).toBeNull();
  expect(screen.getAllByRole('columnheader', { name: 'Показания к трансфузии' })).toHaveLength(1);
  expect(
    screen.getAllByRole('columnheader', { name: 'Данные о донорской крови или ее компоненте' }),
  ).toHaveLength(1);
  const headings = screen.getAllByRole('columnheader').map((heading) => heading.textContent);
  expect(headings.indexOf('Анамнез реципиента')).toBeLessThan(
    headings.indexOf('Показания к трансфузии'),
  );
  expect(headings.indexOf('Показания к трансфузии')).toBeLessThan(
    headings.indexOf('Данные о донорской крови или ее компоненте'),
  );
  for (const text of [
    'Анамнез без потери данных',
    'Признаки гемической гипоксии.',
    'Отмытые эритроциты',
    '761022 000456 36',
    '01.10.2026',
    '31.12.2026',
  ])
    expect(screen.getByText(text)).toBeTruthy();
  const componentChunks = chunks.filter((chunk) => chunk.dataset.protocolBlock === 'donor');
  expect(componentChunks).toHaveLength(4);
  for (const chunk of componentChunks)
    expect(
      getChunkBlockId(chunk.dataset.protocolChunk as (typeof PROTOCOL_CHUNK_ORDER)[number]),
    ).toBe('donor');
});

it('opens the same editor from every part even when pagination separates the subsection', () => {
  const onOpenBlock = vi.fn();
  const chunks = PROTOCOL_CHUNK_ORDER.filter((chunk) => getChunkBlockId(chunk) === 'donor');
  const { container } = render(
    <>
      <table>
        <ProtocolBlocks chunkIds={chunks.slice(0, 2)} values={values} onOpenBlock={onOpenBlock} />
      </table>
      <table>
        <ProtocolBlocks chunkIds={chunks.slice(2)} values={values} onOpenBlock={onOpenBlock} />
      </table>
    </>,
  );
  for (const chunk of container.querySelectorAll('[data-protocol-block="donor"]'))
    fireEvent.click(chunk.querySelector('th,td')!);
  expect(onOpenBlock.mock.calls).toEqual([['donor'], ['donor'], ['donor'], ['donor']]);
});
