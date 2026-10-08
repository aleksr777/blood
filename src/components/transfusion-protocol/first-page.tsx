import { ProtocolBlocks } from './protocol-blocks';
import type { ProtocolBlockId, ProtocolPageProps } from './protocol-types';

type Props = ProtocolPageProps & {
  blockIds: ProtocolBlockId[];
};

export const FirstPage = ({ values, onOpenBlock, blockIds }: Props) => (
  <section className="sheet sheet--first" aria-label="Первая страница протокола трансфузии">
    <div className="legal-note">
      <div>
        Приложение N 11 к Порядку оказания медицинской помощи населению по профилю
        «трансфузиология»,
      </div>
      <div>
        утвержденному приказом Министерства здравоохранения Российской Федерации от 28 октября 2020
        г. N 1170н
      </div>
    </div>

    <table className="protocol-table">
      <tbody>
        <tr>
          <th className="document-title" colSpan={6}>
            ПРОТОКОЛ ТРАНСФУЗИИ
          </th>
        </tr>
      </tbody>

      <ProtocolBlocks blockIds={blockIds} values={values} onOpenBlock={onOpenBlock} />
    </table>
  </section>
);
