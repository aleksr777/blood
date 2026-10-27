import { useEffect } from 'react';
import {
  hasNoPregnancies,
  isNewbornHistoryBlocked,
  OBSTETRIC_UNKNOWN,
  obstetricValuesForEditing,
} from './obstetric-history';
import { ObstetricCountField } from './obstetric-count-field';
import { obstetricHistoryFields } from './obstetric-history-config';
import { ProtocolFieldControl } from './protocol-field-control';
import type { ProtocolValues } from './protocol-types';
import styles from './recipient-history-fields.module.css';

type Props = {
  applyDefaults?: boolean;
  values: ProtocolValues;
  onChange: (values: ProtocolValues) => void;
};

const DEPENDENT_COUNTS = ['recipientBirthsCount', 'recipientSpontaneousAbortionsCount'];
const DEFAULTS = {
  recipientPregnanciesCount: '0',
  recipientBirthsCount: OBSTETRIC_UNKNOWN,
  recipientSpontaneousAbortionsCount: OBSTETRIC_UNKNOWN,
  recipientHemolyticDiseaseNewbornHistory: OBSTETRIC_UNKNOWN,
};

export const ObstetricHistoryFields = ({ values, onChange, applyDefaults = true }: Props) => {
  const editableValues = obstetricValuesForEditing(values);
  const missingDefaults = applyDefaults
    ? Object.fromEntries(Object.entries(DEFAULTS).filter(([name]) => !editableValues[name]?.trim()))
    : {};
  const displayedValues = { ...editableValues, ...missingDefaults };
  const noPregnancies = hasNoPregnancies(displayedValues);
  const pregnancies = displayedValues.recipientPregnanciesCount.trim();
  const dependentMaximum = noPregnancies
    ? 0
    : /^\d+$/.test(pregnancies)
      ? Math.min(Number(pregnancies), 99)
      : 99;

  useEffect(() => {
    if (!applyDefaults || values.recipientObstetricHistoryStatus === 'unknown') return;
    const defaults = Object.fromEntries(
      Object.entries(DEFAULTS).filter(([name]) => !values[name]?.trim()),
    );
    if (Object.keys(defaults).length) onChange(defaults);
  }, [applyDefaults, values, onChange]);

  const changeValue = (name: string, value: string) => {
    const changes: ProtocolValues =
      values.recipientObstetricHistoryStatus === 'unknown'
        ? { ...editableValues, recipientObstetricHistoryStatus: 'known', [name]: value }
        : { [name]: value };
    if (name === 'recipientPregnanciesCount' && /^\d+$/.test(value)) {
      for (const dependent of DEPENDENT_COUNTS) {
        if (Number(displayedValues[dependent]) > Number(value))
          changes[dependent] = OBSTETRIC_UNKNOWN;
      }
    }
    if (
      (name === 'recipientPregnanciesCount' || name === 'recipientBirthsCount') &&
      isNewbornHistoryBlocked({ ...displayedValues, ...changes }) &&
      displayedValues.recipientHemolyticDiseaseNewbornHistory !== OBSTETRIC_UNKNOWN
    )
      changes.recipientHemolyticDiseaseNewbornHistory = OBSTETRIC_UNKNOWN;
    onChange(changes);
  };

  return (
    <fieldset className={styles.group}>
      <legend>Акушерский анамнез</legend>
      <div className={styles.obstetricGrid}>
        {obstetricHistoryFields.map((field) => {
          const disabled =
            (noPregnancies && field.name !== 'recipientPregnanciesCount') ||
            (field.type === 'select' && isNewbornHistoryBlocked(displayedValues));
          const maximum = field.name === 'recipientPregnanciesCount' ? 99 : dependentMaximum;
          return (
            <fieldset
              key={field.name}
              className={styles.obstetricField}
              data-type={field.type}
              disabled={disabled}
            >
              {field.type === 'number' ? (
                <ObstetricCountField
                  key={String(disabled)}
                  name={field.name}
                  label={field.label}
                  value={displayedValues[field.name]}
                  maximum={maximum}
                  onChange={(value) => {
                    if (!disabled) changeValue(field.name, value);
                  }}
                />
              ) : (
                <ProtocolFieldControl
                  key={String(disabled)}
                  field={field}
                  value={displayedValues[field.name]}
                  onChange={(name, value) => {
                    if (!disabled) changeValue(name, value);
                  }}
                />
              )}
            </fieldset>
          );
        })}
      </div>
    </fieldset>
  );
};
