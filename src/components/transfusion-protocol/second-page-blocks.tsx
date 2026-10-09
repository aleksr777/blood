import { LabeledCell, SectionTitle } from './form-controls';
import { MonitorTable } from './monitor-table';
import type { ProtocolPageProps } from './protocol-types';
import { formatDate } from './protocol-types';

export const CompatibilityTestsBlock = ({ values, onOpenBlock }: ProtocolPageProps) => (
  <tbody
    className="fill-block"
    data-protocol-block="compatibilityTests"
    onClick={() => onOpenBlock('compatibilityTests')}
  >
    <SectionTitle>Пробы на индивидуальную совместимость в отделении</SectionTitle>
    <tr className="row-reagents">
      <td colSpan={6} className="span-6 reagent-summary">
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
