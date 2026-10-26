import { useEffect, useState } from 'react';
import { PreviousTransfusionInput } from './previous-transfusion-input';
import { PreviousTransfusionNotice } from './previous-transfusion-notice';
import {
  combinePreviousTransfusionText,
  splitPreviousTransfusionText,
} from './previous-transfusion-text';
import { ObstetricHistoryFields } from './obstetric-history-fields';
import {
  HISTORY_STATUS,
  getHistoryStatus,
  TRANSFUSION_HISTORY_FIELDS,
} from './recipient-history-model';
import type { ProtocolValues } from './protocol-types';
import styles from './recipient-history-fields.module.css';

type Props = {
  applyDefaults?: boolean;
  values: ProtocolValues;
  previousTransfusionSuggestion?: string;
  showObstetricHistory?: boolean;
  showTransfusionHistory?: boolean;
  onChange: (values: ProtocolValues) => void;
};

const STATUS_OPTIONS = [
  [HISTORY_STATUS.none, 'Не было'],
  [HISTORY_STATUS.unknown, 'Не известно'],
  [HISTORY_STATUS.had, 'Были'],
] as const;

export const RecipientHistoryFields = ({
  applyDefaults = true,
  values,
  previousTransfusionSuggestion = '',
  showObstetricHistory = true,
  showTransfusionHistory = true,
  onChange,
}: Props) => {
  const [dismissedSuggestion, setDismissedSuggestion] = useState('');
  const { generated, manual } = splitPreviousTransfusionText(values);
  const suggestion =
    previousTransfusionSuggestion.trim() ||
    generated ||
    values.previousTransfusionsSuggestedText?.trim() ||
    '';
  const previousTransfusionsStatus = getHistoryStatus(
    values.previousTransfusionsStatus,
    values.previousTransfusions,
  );
  const dependentHistoryDisabled = previousTransfusionsStatus !== HISTORY_STATUS.had;
  const suggestionApplied =
    Boolean(suggestion) &&
    values.previousTransfusionsStatus === HISTORY_STATUS.had &&
    generated === suggestion;

  useEffect(() => {
    if (!applyDefaults || !showTransfusionHistory || !dependentHistoryDisabled) return;

    if (values.previousReactionsStatus || values.individualSelectionHistoryStatus) {
      onChange({
        previousReactionsStatus: '',
        individualSelectionHistoryStatus: '',
      });
    }
  }, [
    applyDefaults,
    dependentHistoryDisabled,
    onChange,
    showTransfusionHistory,
    values.individualSelectionHistoryStatus,
    values.previousReactionsStatus,
  ]);

  const changeStatus = (statusName: string, value: string) => {
    if (statusName === 'previousTransfusionsStatus' && value !== HISTORY_STATUS.had) {
      onChange({
        previousTransfusionsStatus: value,
        previousReactionsStatus: '',
        individualSelectionHistoryStatus: '',
      });
      return;
    }

    onChange({ [statusName]: value });
  };

  const applySuggestion = () => {
    if (!suggestion) return;

    onChange({
      previousTransfusionsStatus: HISTORY_STATUS.had,
      previousTransfusions: combinePreviousTransfusionText(
        suggestion,
        manual.trim() === suggestion ? '' : manual,
      ),
      previousTransfusionsAutoText: suggestion,
      previousTransfusionsSuggestedText: suggestion,
    });
    setDismissedSuggestion(suggestion);
  };

  const removeSuggestion = () => {
    setDismissedSuggestion('');
    onChange({
      previousTransfusionsStatus: HISTORY_STATUS.had,
      previousTransfusions: manual,
      previousTransfusionsAutoText: '',
      previousTransfusionsSuggestedText: generated,
    });
  };

  return (
    <div className={styles.root}>
      {showObstetricHistory && values.recipientSex === 'Женский' && (
        <ObstetricHistoryFields values={values} onChange={onChange} />
      )}

      {showTransfusionHistory &&
        TRANSFUSION_HISTORY_FIELDS.map(({ statusName, textName, label }, index) => {
          const status = getHistoryStatus(values[statusName], values[textName]);
          const disabled = index > 0 && dependentHistoryDisabled;

          return (
            <div key={statusName} className={styles.historySection}>
              {index === 0 && (
                <PreviousTransfusionNotice
                  open={
                    Boolean(suggestion) && !suggestionApplied && dismissedSuggestion !== suggestion
                  }
                  suggestion={suggestion}
                  onAccept={applySuggestion}
                  onDecline={() => setDismissedSuggestion(suggestion)}
                />
              )}
              <fieldset
                key={statusName}
                className={[styles.group, disabled ? styles.groupDisabled : '']
                  .filter(Boolean)
                  .join(' ')}
                disabled={disabled}
              >
                <legend>{label}</legend>

                <div className={styles.options}>
                  {STATUS_OPTIONS.map(([value, optionLabel]) => (
                    <label key={value} className={styles.option}>
                      <input
                        type="radio"
                        name={statusName}
                        checked={status === value}
                        onChange={() => changeStatus(statusName, value)}
                      />
                      <span>{optionLabel}</span>
                    </label>
                  ))}
                </div>

                {status === HISTORY_STATUS.had &&
                  (index === 0 ? (
                    <PreviousTransfusionInput
                      generated={generated}
                      manual={manual}
                      label={label}
                      onRemove={removeSuggestion}
                      onChange={(text) =>
                        onChange({
                          previousTransfusions: combinePreviousTransfusionText(generated, text),
                        })
                      }
                    />
                  ) : (
                    <textarea
                      name={textName}
                      aria-label={label}
                      rows={4}
                      value={values[textName] ?? ''}
                      onChange={(event) => onChange({ [textName]: event.target.value })}
                    />
                  ))}
              </fieldset>
            </div>
          );
        })}
    </div>
  );
};
