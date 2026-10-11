import { ProtocolBlocks } from './protocol-blocks';
import type { ProtocolChunkId } from './protocol-pagination';
import type { ProtocolPageProps } from './protocol-types';

type Props = ProtocolPageProps & {
  chunkIds: ProtocolChunkId[];
  pageNumber: number;
};

export const ContinuationPage = ({ values, onOpenBlock, chunkIds, pageNumber }: Props) => (
  <section
    className="sheet sheet--continuation"
    aria-label={`${pageNumber}-я страница протокола трансфузии`}
  >
    <table className="protocol-table">
      <ProtocolBlocks chunkIds={chunkIds} values={values} onOpenBlock={onOpenBlock} />
    </table>
  </section>
);
