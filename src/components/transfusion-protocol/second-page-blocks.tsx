import { LabeledCell, SectionTitle } from './form-controls';
import { MonitorTable } from './monitor-table';
import type { ProtocolPageProps, ProtocolValues } from './protocol-types';
import { formatDate } from './protocol-types';

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
  {
    title: 'Полиглюкин 33%',
    series: 'polyglukinSeries',
    expiration: 'polyglukinExpiration',
    manufacturer: 'polyglukinManufacturer',
  },
] as const;

const hasDetailedReagents = (values: ProtocolValues) =>
  Boolean(
    values.reagentVialsOpenedDate ||
      REAGENT_ROWS.some(
        ({ series, expiration, manufacturer }) =>
          values[series] || values[expiration] || values[manufacturer],
      ),
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

export const CompatibilityTestsBlock = ({ values, onOpenBlock }: ProtocolPageProps) => {
  const detailedReagents = hasDetailedReagents(values);

  return (
    <tbody
      className="fill-block"
      data-protocol-block="compatibilityTests"
      onClick={() => onOpenBlock('compatibilityTests')}
    >
      <SectionTitle>Пробы на индивидуальную совместимость в отделении</SectionTitle>

      <tr className="row-reagents">
        <td colSpan={6} className="span-6 reagent-summary">
          <div className="reagent-summary-content">
            {!detailedReagents &&
            (values.reagentNames || values.reagentSeries || values.reagentExpiration) ? (
              <LegacyReagentDetails values={values} />
            ) : (
              <>
                <div className="reagent-opened-date">
                  <span className="reagent-label">Дата вскрытия флаконов с цоликлонами:</span>
                  {values.reagentVialsOpenedDate && (
                    <span className="reagent-value">{formatDate(values.reagentVialsOpenedDate)}</span>
                  )}
                </div>

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
  );
};

export const ComplicationsBlock = ({ values, onOpenBlock }: ProtocolPageProps) => (
  <tbody
    className="fill-block"
    data-protocol-block="complications"
    onClick={() => onOpenBlock('complications')}
  >
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
);

export const MonitoringBlock = ({ values, onOpenBlock }: ProtocolPageProps) => (
  <tbody
    className="fill-block"
    data-protocol-block="monitoring"
    onClick={() => onOpenBlock('monitoring')}
  >
    <SectionTitle>Наблюдение за состоянием реципиента</SectionTitle>
    <tr>
      <td colSpan={6} className="monitor-wrapper">
        <MonitorTable values={values} />
      </td>
    </tr>
  </tbody>
);

export const DoctorBlock = ({ values, onOpenBlock }: ProtocolPageProps) => (
  <tbody
    className="fill-block"
    data-protocol-block="doctor"
    onClick={() => onOpenBlock('doctor')}
  >
    <tr className="doctor-row">
      <td colSpan={6} className="span-6">
        <div className="doctor-inline">
          <span>Врач, осуществивший трансфузию:</span>
          {values.doctorName && <span className="doctor-value">{values.doctorName}</span>}
        </div>
      </td>
    </tr>
  </tbody>
);
