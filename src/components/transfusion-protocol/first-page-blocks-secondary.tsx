import { formatDonorAntigens } from './donor-model';
import { LabeledCell, SectionTitle } from './form-controls';
import { formatHistoryValue } from './recipient-history-model';
import { getSelectionStatus, SELECTION_STATUS } from './selection-model';
import type { ProtocolPageProps } from './protocol-types';
import { formatDate } from './protocol-types';

type ChunkProps = ProtocolPageProps & {
  part: string;
};

export const HistoryBlock = ({ values, onOpenBlock, part }: ChunkProps) => (
  <tbody
    className="fill-block"
    data-protocol-block="history"
    data-protocol-chunk={`history:${part}`}
    onClick={() => onOpenBlock('history')}
  >
    <SectionTitle>Анамнез реципиента</SectionTitle>
    <tr className="row-history">
      <LabeledCell
        colSpan={2}
        label="Трансфузии компонентов крови в анамнезе"
        value={formatHistoryValue(values, 'previousTransfusionsStatus', 'previousTransfusions')}
      />
      <LabeledCell
        colSpan={2}
        label="Реакции и осложнения на трансфузии в анамнезе"
        value={formatHistoryValue(values, 'previousReactionsStatus', 'previousReactions')}
      />
      <LabeledCell
        colSpan={2}
        label="Трансфузии по индивидуальному подбору"
        value={formatHistoryValue(
          values,
          'individualSelectionHistoryStatus',
          'individualSelectionHistory',
        )}
      />
    </tr>
  </tbody>
);

export const DonorBlock = ({ values, onOpenBlock, part }: ChunkProps) => (
  <tbody
    className="fill-block"
    data-protocol-block="donor"
    data-protocol-chunk={`donor:${part}`}
    onClick={() => onOpenBlock('donor')}
  >
    {part === 'main' && (
      <>
        <SectionTitle>Данные о донорской крови или ее компоненте</SectionTitle>
        <tr className="row-donor-main">
          <LabeledCell
            colSpan={3}
            className="span-3"
            label="Наименование компонента донорской крови"
            value={values.componentName}
          />
          <LabeledCell
            colSpan={3}
            className="span-3"
            label="Наименование организации, осуществившей заготовку"
            value={values.collectionOrganization}
          />
        </tr>
      </>
    )}

    {part === 'blood' && (
      <>
        <tr>
          <LabeledCell
            colSpan={3}
            className="span-3"
            label="Группа крови донора AB0:"
            value={values.donorAbo}
          />
          <LabeledCell
            colSpan={3}
            rowSpan={2}
            className="span-3"
            label="Антигены эритроцитов донора C, c, E, e, K"
            value={formatDonorAntigens(values)}
          />
        </tr>
        <tr>
          <LabeledCell
            colSpan={2}
            label="N единицы компонента крови"
            value={values.componentUnitNumber}
          />
          <LabeledCell colSpan={1} label="Количество (мл)" value={values.amountMl} />
        </tr>
      </>
    )}

    {part === 'dates' && (
      <tr>
        <LabeledCell
          colSpan={3}
          className="span-3"
          label="Дата заготовки:"
          value={formatDate(values.collectionDate)}
        />
        <LabeledCell
          colSpan={3}
          className="span-3"
          label="Срок годности:"
          value={formatDate(values.expirationDate)}
        />
      </tr>
    )}
  </tbody>
);

export const SelectionBlock = ({ values, onOpenBlock, part }: ChunkProps) => {
  const status = getSelectionStatus(values);
  const performed = status === SELECTION_STATUS.performed;

  return (
    <tbody
      className="fill-block"
      data-logical-block="selection"
      data-protocol-block="selection"
      data-protocol-chunk={`selection:${part}`}
      onClick={() => onOpenBlock('selection')}
    >
      {part === 'main' && (
        <>
          <SectionTitle>
            {performed ? 'Результаты индивидуального подбора' : 'Индивидуальный подбор'}
          </SectionTitle>

          {!performed ? (
            <tr className="row-selection-summary">
              <td colSpan={6}>
                {status === SELECTION_STATUS.notPerformed && (
                  <div className="cell-value">Не проводился</div>
                )}
              </td>
            </tr>
          ) : (
            <tr>
              <LabeledCell
                colSpan={6}
                className="span-6"
                label="Наименование медицинской организации, осуществившей индивидуальный подбор"
                value={values.selectionOrganization}
              />
            </tr>
          )}
        </>
      )}

      {performed && part === 'date' && (
        <tr className="row-selection-date">
          <LabeledCell
            colSpan={6}
            className="span-6"
            label="Дата исследования"
            value={formatDate(values.selectionDate)}
          />
        </tr>
      )}

      {performed && part === 'responsible' && (
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
      )}
    </tbody>
  );
};
