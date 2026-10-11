import { LabeledCell, SectionTitle } from './form-controls';
import { formatIndications } from './indications-model';
import {
  formatAlloimmuneAntibodies,
  formatRecipientAntigens,
} from './recipient-examination-model';
import type { ProtocolPageProps } from './protocol-types';
import { formatDate, formatDateTime } from './protocol-types';

type ChunkProps = ProtocolPageProps & {
  part: string;
};

const formatRh = (value?: string) => {
  if (value === 'Rh(D)+' || value === 'Rh(+)') return 'Rh(+)';
  if (value === 'Rh(D)-' || value === 'Rh(-)') return 'Rh(-)';
  return value ?? '';
};

export const GeneralBlock = ({ values, onOpenBlock, part }: ChunkProps) => (
  <tbody
    className="fill-block"
    data-protocol-block="general"
    data-protocol-chunk={`general:${part}`}
    onClick={() => onOpenBlock('general')}
  >
    {part === 'main' && (
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
    )}

    {part === 'times' && (
      <tr className="row-top-data">
        <LabeledCell colSpan={2} label="Отделение" value={values.department} />
        <LabeledCell
          colSpan={2}
          label="№ медицинской карты"
          value={values.medicalRecordNumber}
        />
        <td colSpan={2}>
          <div className="stacked-field">
            <div>Время начала трансфузии:</div>
            <div className="blank-line">{values.startTime}</div>
          </div>
          <div className="stacked-field stacked-field--second">
            <div>Время окончания трансфузии:</div>
            <div className="blank-line">{values.endTime}</div>
          </div>
        </td>
      </tr>
    )}
  </tbody>
);

export const ExaminationBlock = ({ values, onOpenBlock, part }: ChunkProps) => (
  <tbody
    className="fill-block"
    data-protocol-block="examination"
    data-protocol-chunk={`examination:${part}`}
    onClick={() => onOpenBlock('examination')}
  >
    {part === 'main' && (
      <>
        <SectionTitle>Данные медицинского обследования реципиента</SectionTitle>
        <tr>
          <LabeledCell
            colSpan={3}
            className="span-3"
            inline
            label="Группа крови реципиента AB0:"
            value={values.recipientAbo}
          />
          <LabeledCell
            colSpan={3}
            className="span-3"
            inline
            label="Резус-принадлежность"
            value={formatRh(values.recipientRh)}
          />
        </tr>
      </>
    )}

    {part === 'antigens' && (
      <tr>
        <LabeledCell
          colSpan={3}
          className="span-3"
          label="Антигены"
          value={formatRecipientAntigens(values)}
        />
        <LabeledCell
          colSpan={3}
          className="span-3"
          label="Аллоиммунные антитела"
          value={formatAlloimmuneAntibodies(values)}
        />
      </tr>
    )}
  </tbody>
);

export const IndicationsBlock = ({ values, onOpenBlock, part }: ChunkProps) => (
  <tbody
    className="fill-block"
    data-protocol-block="indications"
    data-protocol-chunk={`indications:${part}`}
    onClick={() => onOpenBlock('indications')}
  >
    <SectionTitle>Показания к трансфузии</SectionTitle>
    <tr className="row-large-blank">
      <td colSpan={6}>
        {formatIndications(values) && (
          <div className="cell-value cell-value--multiline">{formatIndications(values)}</div>
        )}
      </td>
    </tr>
  </tbody>
);
