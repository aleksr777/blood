import { useEffect } from 'react';
import { HISTORY_STATUS, getHistoryStatus } from './recipient-history-model';
import type { ProtocolValues } from './protocol-types';
import styles from './recipient-history-fields.module.css';

type Props = {
  values: ProtocolValues;
  previousTransfusionSuggestion?: string;
  onChange: (values: ProtocolValues) => void;
};

const HISTORY_FIELDS = [
  {
    statusName: 'previousTransfusionsStatus',
    textName: 'previousTransfusions',
    label: 'Трансфузии компонентов крови в анамнезе',
  },
  {
    statusName: 'previousReactionsStatus',
    textName: 'previousReactions',
    label: 'Реакции и осложнения на трансфузии в анамнезе',
  },
  {
    statusName: 'individualSelectionHistoryStatus',
    textName: 'individualSelectionHistory',
    label: 'Трансфузии по индивидуальному подбору',
  },
] as const;

const STATUS_OPTIONS = [
  [HISTORY_STATUS.none, 'Не было'],
  [HISTORY_STATUS.unknown, 'Не известно'],
  [HISTORY_STATUS.had, 'Были'],
] as const;

export const RecipientHistoryFields = ({
  values,
  previousTransfusionSuggestion = '',
  onChange,
}: Props) => {
  const suggestion = previousTransfusionSuggestion.trim();
  const previousTransfusionsStatus = getHistoryStatus(
    values.previousTransfusionsStatus,
    values.previousTransfusions,
  );
  const dependentHistoryDisabled =
    previousTransfusionsStatus !== HISTORY_STATUS.had;
  const suggestionApplied =
    Boolean(suggestion) &&
    values.previousTransfusionsStatus === HISTORY_STATUS.had &&
    values.previousTransfusionsAutoText === suggestion &&
    values.previousTransfusions === suggestion;

  useEffect(() => {
    if (!dependentHistoryDisabled) return;

    if (
      values.previousReactionsStatus ||
      values.previousReactions ||
      values.individualSelectionHistoryStatus ||
      values.individualSelectionHistory
    ) {
      onChange({
        previousReactionsStatus: '',
        previousReactions: '',
        individualSelectionHistoryStatus: '',
        individualSelectionHistory: '',
      });
    }
  }, [
    dependentHistoryDisabled,
    onChange,
    values.individualSelectionHistory,
    values.individualSelectionHistoryStatus,
    values.previousReactions,
    values.previousReactionsStatus,
  ]);

  const changeStatus = (statusName: string, value: string) => {
    if (
      statusName === 'previousTransfusionsStatus' &&
      value !== HISTORY_STATUS.had
    ) {
      onChange({
        previousTransfusionsStatus: value,
        previousReactionsStatus: '',
        previousReactions: '',
        individualSelectionHistoryStatus: '',
        individualSelectionHistory: '',
      });
      return;
    }

    onChange({ [statusName]: value });
  };

  const applySuggestion = () => {
    if (!suggestion) return;

    onChange({
      previousTransfusionsStatus: HISTORY_STATUS.had,
      previousTransfusions: suggestion,
      previousTransfusionsAutoText: suggestion,
    });
  };

  return (
    <div className={styles.root}>
      {suggestion && (
        <div className={styles.suggestion}>
          <div className={styles.suggestionHeader}>
            <div>
              <div className={styles.suggestionTitle}>
                Найдены предыдущие трансфузии
              </div>
              <div className={styles.suggestionHint}>
                Текст сформирован по предыдущим протоколам и не будет внесён без подтверждения.
              </div>
            </div>
            <button
              type="button"
              className={styles.suggestionButton}
              disabled={suggestionApplied}
              onClick={applySuggestion}
            >
              {suggestionApplied ? 'Внесено' : 'Внести в анамнез'}
            </button>
          </div>

          <div className={styles.suggestionPreview} aria-label="Предварительный просмотр">
            {suggestion}
          </div>
        </div>
      )}

      {HISTORY_FIELDS.map(({ statusName, textName, label }, index) => {
        const status = getHistoryStatus(values[statusName], values[textName]);
        const disabled = index > 0 && dependentHistoryDisabled;

        return (
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

            {status === HISTORY_STATUS.had && (
              <textarea
                name={textName}
                rows={4}
                value={values[textName] ?? ''}
                onChange={(event) => onChange({ [textName]: event.target.value })}
              />
            )}
          </fieldset>
        );
      })}
    </div>
  );
};
