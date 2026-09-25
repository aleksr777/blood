import { GeneralBlock, ExaminationBlock, IndicationsBlock } from './first-page-blocks-primary';
import { DonorBlock, HistoryBlock, SelectionBlock } from './first-page-blocks-secondary';
import type { ProtocolPageProps } from './protocol-types';

export const FirstPage = ({ values, onOpenBlock }: ProtocolPageProps) => (
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

      <GeneralBlock values={values} onOpenBlock={onOpenBlock} />
      <ExaminationBlock values={values} onOpenBlock={onOpenBlock} />
      <IndicationsBlock values={values} onOpenBlock={onOpenBlock} />
      <HistoryBlock values={values} onOpenBlock={onOpenBlock} />
      <DonorBlock values={values} onOpenBlock={onOpenBlock} />
      <SelectionBlock values={values} onOpenBlock={onOpenBlock} />
    </table>
  </section>
);
