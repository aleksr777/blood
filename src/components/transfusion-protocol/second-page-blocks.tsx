import { COMPLICATIONS_STATUS, getComplicationsStatus } from './complications-model';
import { LabeledCell, SectionTitle } from './form-controls';
import { MonitorTable } from './monitor-table';
import type { ProtocolPageProps, ProtocolValues } from './protocol-types';
import { formatDate } from './protocol-types';

type ChunkProps = ProtocolPageProps & {
  part: string;
};

const REAGENT_ROWS = [
  {
    title: 'Цоликлон "анти-A"',
    series: 'reagentAntiASeries',
    expiration: 'reagentAntiAExpiration',
    manufacturer: 'reagentAntiAManufacturer',
  },
  {
    title: 'Цоликлон "анти-B"',
    series: 'reagentAntiBSeries',
    expiration: 'reagentAntiBExpiration',
    manufacturer: 'reagentAntiBManufacturer',
  },
  {
    title: 'Цоликлон "анти-AB"',
    series: 'reagentAntiABSeries',
    expiration: 'reagentAntiABExpiration',
    manufacturer: 'reagentAntiABManufacturer',
  },
  {
    title: 'Цоликлон "анти-D"',
    series: 'reagentAntiDSeries',
    expiration: 'reagentAntiDExpiration',
    manufacturer: 'reagentAntiDManufacturer',
  },
] as const;

const hasDetailedReagents = (values: ProtocolValues) =>
  REAGENT_ROWS.some(
    ({ series, expiration, manufacturer }) =>
      values[series] || values[expiration] || values[manufacturer],
  );

const LegacyReagentDetails = ({ values }: { values: ProtocolValues }) => (
  <>
    <div className="reagent-line">
      <span className="reagent-label">Наименования реагентов:</span>
      {values.reagentNames && <span className="reagent-value">{values.reagentNames}</span>}
    </div>
    <div className="reagent-line">
      <span className="reagent-label">N серии реагента:</span>
      {values.reagentSeries && <span className="reagent-value">{values.reagentSeries}</span>}
    </div>
    <div className="reagent-line">
      <span className="reagent-label">Срок годности:</span>
      {values.reagentExpiration && (
        <span className="reagent-value">{formatDate(values.reagentExpiration)}</span>
      )}
    </div>
  </>
);

export const CompatibilityTestsBlock = ({ values, onOpenBlock, part }: ChunkProps) => {
  const detailedReagents = hasDetailedReagents(values);
  const recipientAboConfirmed =
    (values.confirmedRecipientAboResult || 'Подтверждено') === 'Подтверждено';
  const donorAboConfirmed =
    (values.confirmedDonorAboResult || 'Подтверждено') === 'Подтверждено';
  const showDonorAboConfirmation = values.componentGroup === 'erythrocytes';
  const planeTestResult = values.planeTestResult || 'Совместимо';
  const biologicalTestResult = values.biologicalTestResult || 'Совместимо';

  return (
    <tbody
      className="fill-block"
      data-protocol-block="compatibilityTests"
      data-protocol-chunk={`compatibilityTests:${part}`}
      onClick={() => onOpenBlock('compatibilityTests')}
    >
      {part === 'main' && (
        <>
          <SectionTitle>Пробы на индивидуальную совместимость в отделении</SectionTitle>
          <tr className="row-reagents">
            <td colSpan={6} className="span-6 reagent-summary">
              <div className="reagent-summary-content">
                {!detailedReagents &&
                (values.reagentNames || values.reagentSeries || values.reagentExpiration) ? (
                  <LegacyReagentDetails values={values} />
                ) : (
                  <>
                    <div className="reagent-name">Наименования реагентов</div>
                    {REAGENT_ROWS.map(({ title, series, expiration, manufacturer }) => (
                      <div className="reagent-item" key={title}>
                        <div className="reagent-name">{title}</div>
                        <div className="reagent-inline-fields">
                          <span className="reagent-label">серия:</span>
                          <span className="reagent-value">{values[series] ?? ''}</span>
                          <span className="reagent-label">годен до:</span>
                          <span className="reagent-value">{formatDate(values[expiration])}</span>
                          <span className="reagent-label">производитель:</span>
                          <span className="reagent-value">{values[manufacturer] ?? ''}</span>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </td>
          </tr>
        </>
      )}

      {part === 'confirmed' && (
        <tr className="row-confirmed-blood-groups">
          <td
            colSpan={showDonorAboConfirmation ? 3 : 6}
            className={showDonorAboConfirmation ? 'span-3' : 'span-6'}
          >
            <div className="compatibility-inline">
              <span className="compatibility-inline-label">
                Подтверждена группа крови реципиента:
              </span>
              <span
                className={[
                  'compatibility-inline-value',
                  recipientAboConfirmed ? '' : 'compatibility-inline-value--below',
                ].filter(Boolean).join(' ')}
              >
                {recipientAboConfirmed ? values.recipientAbo : 'Не подтверждено'}
              </span>
            </div>
          </td>

          {showDonorAboConfirmation && (
            <td colSpan={3} className="span-3">
              <div className="compatibility-inline">
                <span className="compatibility-inline-label">
                  Подтверждена группа крови донора:
                </span>
                <span
                  className={[
                    'compatibility-inline-value',
                    donorAboConfirmed ? '' : 'compatibility-inline-value--below',
                  ].filter(Boolean).join(' ')}
                >
                  {donorAboConfirmed ? values.donorAbo : 'Не подтверждено'}
                </span>
              </div>
            </td>
          )}
        </tr>
      )}

      {part === 'tests' && (
        <tr className="row-tests">
          <td colSpan={3} className="span-3">
            <div className="compatibility-inline">
              <span className="compatibility-inline-label">На плоскости:</span>
              <span className="compatibility-inline-value">{planeTestResult}</span>
            </div>
          </td>
          <td colSpan={3} className="span-3">
            <div className="compatibility-inline">
              <span className="compatibility-inline-label">Биологическая проба:</span>
              <span className="compatibility-inline-value">{biologicalTestResult}</span>
            </div>
          </td>
        </tr>
      )}
    </tbody>
  );
};

export const ComplicationsBlock = ({ values, onOpenBlock, part }: ChunkProps) => {
  const status = getComplicationsStatus(values);

  return (
    <tbody
      className="fill-block"
      data-protocol-block="complications"
      data-protocol-chunk={`complications:${part}`}
      onClick={() => onOpenBlock('complications')}
    >
      <SectionTitle>Реакции и осложнения</SectionTitle>

      {status === COMPLICATIONS_STATUS.none ? (
        <tr className="row-complications">
          <td colSpan={6} className="span-6">
            <div className="cell-value">Не было</div>
          </td>
        </tr>
      ) : (
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
      )}
    </tbody>
  );
};

export const MonitoringBlock = ({ values, onOpenBlock, part }: ChunkProps) => (
  <tbody
    className="fill-block"
    data-protocol-block="monitoring"
    data-protocol-chunk={`monitoring:${part}`}
    onClick={() => onOpenBlock('monitoring')}
  >
    {part === 'main' && <SectionTitle>Наблюдение за состоянием реципиента</SectionTitle>}
    <tr className="monitor-segment">
      <td colSpan={6} className="monitor-wrapper">
        <MonitorTable
          values={values}
          part={part === 'hour1' ? 'hour1' : part === 'hour2' ? 'hour2' : 'main'}
        />
      </td>
    </tr>
  </tbody>
);

export const DoctorBlock = ({ values, onOpenBlock, part }: ChunkProps) => (
  <tbody
    className="fill-block"
    data-protocol-block="doctor"
    data-protocol-chunk={`doctor:${part}`}
    onClick={() => onOpenBlock('doctor')}
  >
    <tr className="doctor-row">
      <td colSpan={6} className="span-6">
        <div className="doctor-staff">
          <div className="doctor-inline">
            <span>Врач, осуществивший трансфузию:</span>
            {values.doctorName && <span className="doctor-value">{values.doctorName}</span>}
          </div>
          <div className="doctor-inline">
            <span>Медицинская сестра:</span>
            {values.nurseName && <span className="doctor-value">{values.nurseName}</span>}
          </div>
        </div>
      </td>
    </tr>
  </tbody>
);
