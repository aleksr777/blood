import { LabeledCell, SectionTitle } from './form-controls';
import { MonitorTable } from './monitor-table';
import type { ProtocolPageProps } from './protocol-types';
import { formatDate } from './protocol-types';

export const SecondPage = ({ values, onOpenBlock }: ProtocolPageProps) => (
  <section className="sheet sheet--second" aria-label="Вторая страница протокола трансфузии">
    <table className="protocol-table">
      <tbody
        className="fill-block"
        data-logical-block="selection"
        onClick={() => onOpenBlock('selection')}
      >
        <tr className="row-responsible">
          <LabeledCell
            colSpan={3}
            className="span-3"
            label="Фамилия, имя, отчество (при наличии) ответственного лица"
            value={values.responsiblePerson}
          />
          <LabeledCell
            colSpan={3}
            className="span-3"
            label="Заключение (совместимо/несовместимо)"
            value={values.compatibilityConclusion}
          />
        </tr>
      </tbody>

      <tbody className="fill-block" onClick={() => onOpenBlock('compatibilityTests')}>
        <SectionTitle>Пробы на индивидуальную совместимость в отделении</SectionTitle>
        <tr>
          <LabeledCell
            colSpan={6}
            className="span-6"
            label="Наименования реагентов"
            value={values.reagentNames}
          />
        </tr>
        <tr>
          <LabeledCell
            colSpan={4}
            className="span-4"
            label="N серии реагента"
            value={values.reagentSeries}
          />
          <LabeledCell
            colSpan={2}
            className="span-2"
            label="Срок годности"
            value={formatDate(values.reagentExpiration)}
          />
        </tr>
        <tr className="row-tests">
          <LabeledCell
            colSpan={3}
            className="span-3"
            centered
            label="На плоскости"
            value={values.planeTestResult}
          />
          <LabeledCell
            colSpan={3}
            className="span-3"
            centered
            label="Биологическая проба"
            value={values.biologicalTestResult}
          />
        </tr>
      </tbody>

      <tbody className="fill-block" onClick={() => onOpenBlock('complications')}>
        <SectionTitle>Реакции и осложнения</SectionTitle>
        <tr className="row-complications">
          <LabeledCell
            colSpan={3}
            className="span-3"
            label="Основные симптомы"
            value={values.symptoms}
          />
          <LabeledCell
            colSpan={3}
            className="span-3"
            label="Степень тяжести"
            value={values.severity}
          />
        </tr>
      </tbody>

      <tbody className="fill-block" onClick={() => onOpenBlock('monitoring')}>
        <SectionTitle>Наблюдение за состоянием реципиента</SectionTitle>
        <tr>
          <td colSpan={6} className="monitor-wrapper">
            <MonitorTable values={values} />
          </td>
        </tr>
      </tbody>

      <tbody className="fill-block" onClick={() => onOpenBlock('doctor')}>
        <tr className="doctor-row">
          <LabeledCell
            colSpan={6}
            className="span-6"
            label="Врач, осуществивший трансфузию:"
            value={values.doctorName}
          />
        </tr>
      </tbody>
    </table>
  </section>
);
