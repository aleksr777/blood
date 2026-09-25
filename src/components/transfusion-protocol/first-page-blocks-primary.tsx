import { LabeledCell, SectionTitle } from './form-controls';
import type { ProtocolPageProps } from './protocol-types';
import { formatDate, formatDateTime } from './protocol-types';

export const GeneralBlock = ({ values, onOpenBlock }: ProtocolPageProps) => (
  <tbody className="fill-block" onClick={() => onOpenBlock('general')}>
    <tr className="row-top-data">
      <LabeledCell
        colSpan={2}
        className="w-30"
        label="Фамилия, имя, отчество (при наличии) реципиента"
        value={values.recipientName}
      />
      <LabeledCell
        colSpan={2}
        className="w-31"
        label="Дата и время подачи заявки"
        value={formatDateTime(values.requestDateTime)}
      />
      <LabeledCell
        colSpan={2}
        className="w-39"
        label="Дата трансфузии"
        value={formatDate(values.transfusionDate)}
      />
    </tr>
    <tr className="row-top-data">
      <LabeledCell colSpan={2} label="Отделение" value={values.department} />
      <LabeledCell colSpan={2} label="N и/б" value={values.medicalRecordNumber} />
      <td colSpan={2}>
        <div className="stacked-field">
          <div>Время начала трансфузии</div>
          <div className="blank-line">{values.startTime}</div>
        </div>
        <div className="stacked-field stacked-field--second">
          <div>Время окончания трансфузии</div>
          <div className="blank-line">{values.endTime}</div>
        </div>
      </td>
    </tr>
  </tbody>
);

export const ExaminationBlock = ({ values, onOpenBlock }: ProtocolPageProps) => (
  <tbody className="fill-block" onClick={() => onOpenBlock('examination')}>
    <SectionTitle>Данные медицинского обследования реципиента</SectionTitle>
    <tr>
      <LabeledCell
        colSpan={4}
        className="span-4"
        label="Группа крови реципиента AB0:"
        value={values.recipientAbo}
      />
      <LabeledCell
        colSpan={2}
        className="span-2"
        label="Резус-принадлежность"
        value={values.recipientRh}
      />
    </tr>
    <tr>
      <LabeledCell
        colSpan={4}
        className="span-4"
        label="Антигены C, c, E, e, K"
        value={values.recipientAntigens}
      />
      <LabeledCell
        colSpan={2}
        className="span-2"
        label="Аллоиммунные антитела"
        value={values.alloimmuneAntibodies}
      />
    </tr>
  </tbody>
);

export const IndicationsBlock = ({ values, onOpenBlock }: ProtocolPageProps) => (
  <tbody className="fill-block" onClick={() => onOpenBlock('indications')}>
    <SectionTitle>Показания к трансфузии</SectionTitle>
    <tr className="row-large-blank">
      <td colSpan={6}>
        {values.indications && <div className="cell-value cell-value--multiline">{values.indications}</div>}
      </td>
    </tr>
  </tbody>
);
