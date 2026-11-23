import type { ReactNode } from 'react';
import { RecipientExaminationFields } from './recipient-examination-fields';
import { RecipientHistoryFields } from './recipient-history-fields';
import type { ProtocolValues } from './protocol-types';
import styles from './recipient-input-sections.module.css';

type CommonProps = {
  values: ProtocolValues;
  onChange: (changes: ProtocolValues) => void;
  showTitle?: boolean;
};

const InputSection = ({
  title,
  showTitle,
  children,
}: {
  title: string;
  showTitle: boolean;
  children: ReactNode;
}) => (
  <fieldset className={styles.section} aria-label={showTitle ? undefined : title}>
    {showTitle && <legend>{title}</legend>}
    {children}
  </fieldset>
);

type ExaminationProps = CommonProps & {
  title?: string;
  showAlloimmuneAntibodies?: boolean;
};

export const RecipientExaminationSection = ({
  values,
  onChange,
  title = 'Данные медицинского обследования реципиента',
  showTitle = true,
  showAlloimmuneAntibodies = true,
}: ExaminationProps) => (
  <InputSection title={title} showTitle={showTitle}>
    <RecipientExaminationFields
      values={values}
      onChange={onChange}
      showAlloimmuneAntibodies={showAlloimmuneAntibodies}
    />
  </InputSection>
);

type HistoryProps = CommonProps & {
  applyDefaults?: boolean;
  previousTransfusionSuggestion?: string;
  showObstetricHistory?: boolean;
  showTransfusionHistory?: boolean;
};

export const RecipientHistorySection = ({
  values,
  onChange,
  showTitle = true,
  applyDefaults = true,
  previousTransfusionSuggestion,
  showObstetricHistory = true,
  showTransfusionHistory = true,
}: HistoryProps) => (
  <InputSection title="Анамнез реципиента" showTitle={showTitle}>
    <RecipientHistoryFields
      values={values}
      onChange={onChange}
      applyDefaults={applyDefaults}
      previousTransfusionSuggestion={previousTransfusionSuggestion}
      showObstetricHistory={showObstetricHistory}
      showTransfusionHistory={showTransfusionHistory}
    />
  </InputSection>
);
