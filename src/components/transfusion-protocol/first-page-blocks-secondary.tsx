import { LabeledCell, SectionTitle } from './form-controls';
import type { ProtocolPageProps } from './protocol-types';
import { formatDate } from './protocol-types';

export const HistoryBlock = ({ values, onOpenBlock }: ProtocolPageProps) => (
  <tbody className="fill-block" onClick={() => onOpenBlock('history')}>
    <SectionTitle>Анамнез реципиента</SectionTitle>
    <tr className="row-history">
      <LabeledCell
        colSpan={2}
        centered
        label="Трансфузии компонентов крови в анамнезе"
        value={values.previousTransfusions}
      />
      <LabeledCell
        colSpan={2}
        centered
        label="Реакции и осложнения на трансфузии в анамнезе"
        value={values.previousReactions}
      />
      <LabeledCell
        colSpan={2}
        centered
        label="Трансфузии по индивидуальному подбору"
        value={values.individualSelectionHistory}
      />
    </tr>
  </tbody>
);

export const DonorBlock = ({ values, onOpenBlock }: ProtocolPageProps) => (
  <tbody className="fill-block" onClick={() => onOpenBlock('donor')}>
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
        value={values.donorAntigens}
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
  </tbody>
);

export const SelectionBlock = ({ values, onOpenBlock }: ProtocolPageProps) => (
  <tbody
    className="fill-block"
    data-logical-block="selection"
    onClick={() => onOpenBlock('selection')}
  >
    <SectionTitle>Результаты индивидуального подбора</SectionTitle>
    <tr>
      <LabeledCell
        colSpan={6}
        className="span-6"
        label="Наименование медицинской организации, осуществившей индивидуальный подбор"
        value={values.selectionOrganization}
      />
    </tr>
    <tr className="row-final-page1">
      <LabeledCell
        colSpan={6}
        className="span-6"
        label="Дата исследования"
        value={formatDate(values.selectionDate)}
      />
    </tr>
  </tbody>
);
