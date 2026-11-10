import type { KeyboardEvent } from 'react';
import { formatDirectionDate } from './request-common';
import { formatRequestDateTime, formatRequestedQuantity } from './component-request-447n';
import type { ProtocolValues } from '../transfusion-protocol/protocol-types';
import { ComponentRequestIssuedPage } from './component-request-issued-page';
import styles from './component-request-form.module.css';

export type ComponentRequestFormValues = {
  recipientName: string;
  recipientProfileSnapshot: ProtocolValues;
  recipientAge: string;
  diagnosis: string;
  medicalRecordNumber: string;
  recipientAboRh: string;
  recipientPhenotype: string;
  department: string;
  departmentPhone: string;
  requestDateTime: string;
  plannedTransfusionDateTime: string;
  transfusionOrder: string;
  requiredComponent: string;
  componentCode: string;
  quantity: string;
  estimatedVolumeMl: string;
  transfusionIndicationCode: string;
  individualSelectionRequired: string;
  individualSelectionCode: string;
  stemCellDonorAbo: string;
  stemCellDonorRh: string;
  stemCellDonorAntigens: string;
  doctorName: string;
  directionDate: string;
};

type Section = 'organization' | 'recipient' | 'examination' | 'component' | 'stem-donor' | 'footer';

type Props = {
  values: ComponentRequestFormValues;
  examination: ProtocolValues;
  readOnly: boolean;
  onEdit: (section: Section) => void;
};

const DISPLAY_CARE_FORM: Record<string, string> = {
  planned: 'плановая',
  emergency: 'экстренная или неотложная',
  urgent: 'экстренная или неотложная',
};

const columns = [17, 7, 6, 6, 10, 10, 8, 8, 6, 7, 7, 8];

const headers = [
  'Фамилия, имя, отчество (при наличии), дата рождения и диагноз реципиента',
  '№ медицинской карты',
  'Группа крови AB0',
  'Резус-принадлежность',
  'Антигены эритроцитов C, c, E, e, K, k и других систем',
  'Идентификационный код донорской крови и (или) её компонента',
  'Количество (единицы измерения)',
  'Код показания к трансфузии',
  'Необходимость индивидуального подбора (да/нет)',
  'Код показания для индивидуального подбора',
  'Группа крови AB0 донора аллогенного КМ или ГСК',
  'Резус-принадлежность и антигены C, c, E, e, K, k донора аллогенного КМ или ГСК',
];

export const ComponentRequestForm = ({ values, examination, readOnly, onEdit }: Props) => {
  const edit = (section: Section) => ({
    className: `${styles.editable} ${readOnly ? styles.readOnly : ''}`,
    role: readOnly ? undefined : ('button' as const),
    tabIndex: readOnly ? -1 : 0,
    onClick: () => !readOnly && onEdit(section),
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      if (!readOnly && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        onEdit(section);
      }
    },
  });

  const recipientBirthDate =
    examination.recipientBirthDate || values.recipientProfileSnapshot.recipientBirthDate;
  const [legacyAbo = '', legacyRh = ''] = values.recipientAboRh.split(' ');
  const recipientAbo = examination.recipientAbo || legacyAbo;
  const recipientRh = examination.recipientRh || legacyRh;
  const phenotype = values.recipientPhenotype;
  const physician = values.doctorName;

  return (
    <div className={styles.wrap} data-document-paper>
      <section
        className={`${styles.paper} ${styles.pageOne}`}
        aria-label="Заявка, приложение № 17 к приказу № 447н, страница 1"
      >
        <div className={styles.approval}>
          Приложение № 17 к приказу Министерства здравоохранения Российской Федерации
          <span>от 18 мая 2026 г. № 447н</span>
          <span>
            Унифицированная форма медицинской документации утверждена приказом Министерства
            здравоохранения Российской Федерации от 18 мая 2026 г. № 447н
          </span>
        </div>
        <h1 className={styles.title}>ЗАЯВКА</h1>
        <div className={styles.subtitle}>
          на донорскую кровь и её компоненты из структурного подразделения медицинской организации в
          кабинет трансфузиологии, отделение трансфузиологии (отделение переливания крови) для
          клинического использования
        </div>

        <table className={styles.metadata}>
          <tbody>
            <tr {...edit('organization')}>
              <th>
                Наименование и контактный телефон подразделения медицинской организации,
                осуществляющего клиническое использование донорской крови и (или) её компонентов
              </th>
              <td>{[values.department, values.departmentPhone].filter(Boolean).join(', ')}</td>
            </tr>
            <tr {...edit('organization')}>
              <th>Дата и время подачи заявки</th>
              <td>
                {formatRequestDateTime(values.requestDateTime) ||
                  formatDirectionDate(values.directionDate)}
              </td>
            </tr>
            <tr {...edit('organization')}>
              <th>Предполагаемые дата и время трансфузии</th>
              <td>{formatRequestDateTime(values.plannedTransfusionDateTime)}</td>
            </tr>
            <tr {...edit('organization')}>
              <th>Форма оказания медицинской помощи (нужное подчеркнуть)</th>
              <td>
                <span
                  className={
                    values.transfusionOrder === 'emergency' || values.transfusionOrder === 'urgent'
                      ? styles.underlined
                      : ''
                  }
                >
                  экстренная или неотложная
                </span>
                {' / '}
                <span className={values.transfusionOrder === 'planned' ? styles.underlined : ''}>
                  плановая трансфузия
                </span>
                {values.transfusionOrder && (
                  <span className={styles.screenOnly}>
                    {' '}
                    ({DISPLAY_CARE_FORM[values.transfusionOrder]})
                  </span>
                )}
              </td>
            </tr>
          </tbody>
        </table>

        <table className={styles.dataTable} aria-label="Графы 1–12 заявки">
          <colgroup>
            {columns.map((width, index) => (
              <col key={index} style={{ width: `${width}%` }} />
            ))}
          </colgroup>
          <thead>
            <tr className={styles.groupRow}>
              <th colSpan={10}>Заполняется врачом, проводящим трансфузию</th>
              <th colSpan={2}>
                Сведения о доноре костного мозга или гемопоэтических стволовых клеток (заполняется
                при аллогенной трансплантации)
              </th>
            </tr>
            <tr className={styles.headerRow}>
              {headers.map((header, index) => (
                <th key={index}>{header}</th>
              ))}
            </tr>
            <tr className={styles.numberRow}>
              {headers.map((_, index) => (
                <th key={index}>{index + 1}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className={styles.valuesRow}>
              <td {...edit('recipient')}>
                {values.recipientName}
                {recipientBirthDate && <div>{formatDirectionDate(recipientBirthDate)}</div>}
                {values.diagnosis && <div className={styles.wrapText}>{values.diagnosis}</div>}
              </td>
              <td {...edit('recipient')}>{values.medicalRecordNumber}</td>
              <td {...edit('examination')}>{recipientAbo}</td>
              <td {...edit('examination')}>{recipientRh}</td>
              <td
                {...edit('examination')}
                className={`${styles.editable} ${styles.wrapText} ${readOnly ? styles.readOnly : ''}`}
              >
                {phenotype}
              </td>
              <td {...edit('component')}>
                <div>{values.componentCode}</div>
                {values.requiredComponent && (
                  <span className={styles.componentName}>{values.requiredComponent}</span>
                )}
              </td>
              <td {...edit('component')}>
                {formatRequestedQuantity(values.quantity, values.estimatedVolumeMl)}
              </td>
              <td {...edit('component')}>{values.transfusionIndicationCode}</td>
              <td {...edit('component')}>
                {values.individualSelectionRequired === 'yes'
                  ? 'да'
                  : values.individualSelectionRequired === 'no'
                    ? 'нет'
                    : ''}
              </td>
              <td {...edit('component')}>{values.individualSelectionCode}</td>
              <td {...edit('stem-donor')}>{values.stemCellDonorAbo}</td>
              <td {...edit('stem-donor')}>
                {[values.stemCellDonorRh, values.stemCellDonorAntigens].filter(Boolean).join(', ')}
              </td>
            </tr>
          </tbody>
        </table>

        <div
          {...edit('footer')}
          className={`${styles.signature} ${styles.editable} ${readOnly ? styles.readOnly : ''}`}
        >
          <span>Врач, проводящий трансфузию:</span>
          <span className={styles.physician}>{physician}</span>
          <span className={styles.signatureLine} />
          <span className={`${styles.signatureCaption} ${styles.signatureNameCaption}`}>
            Фамилия, имя, отчество (при наличии)
          </span>
          <span className={`${styles.signatureCaption} ${styles.signatureAutographCaption}`}>
            Подпись
          </span>
        </div>
      </section>
      <section
        className={`${styles.paper} ${styles.pageTwo}`}
        aria-label="Выдано из трансфузиологического кабинета, страница 2"
      >
        <ComponentRequestIssuedPage />
      </section>
    </div>
  );
};
