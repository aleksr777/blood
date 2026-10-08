import { ProtocolBlocks } from './protocol-blocks';
import type { ProtocolBlockId, ProtocolPageProps } from './protocol-types';

type Props = ProtocolPageProps & {
  blockIds: ProtocolBlockId[];
};

export const SecondPage = ({ values, onOpenBlock, blockIds }: Props) => (
  <section className="sheet sheet--second" aria-label="Вторая страница протокола трансфузии">
    <table className="protocol-table">
      <ProtocolBlocks blockIds={blockIds} values={values} onOpenBlock={onOpenBlock} />
    </table>
  </section>
);
