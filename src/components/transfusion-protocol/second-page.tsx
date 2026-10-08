import { ProtocolBlocks } from './protocol-blocks';
import type { ProtocolBlockId, ProtocolPageProps } from './protocol-types';

type Props = ProtocolPageProps & {
  blockIds: ProtocolBlockId[];
  pageNumber: number;
};

export const ContinuationPage = ({ values, onOpenBlock, blockIds, pageNumber }: Props) => (
  <section
    className="sheet sheet--continuation"
    aria-label={`${pageNumber}-я страница протокола трансфузии`}
  >
    <table className="protocol-table">
      <ProtocolBlocks blockIds={blockIds} values={values} onOpenBlock={onOpenBlock} />
    </table>
  </section>
);
