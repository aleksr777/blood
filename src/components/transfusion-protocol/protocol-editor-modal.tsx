import { useEffect, useState } from 'react';
import Modal from '../modal/modal';
import { getProtocolBlockConfig } from './editor-config';
import { CompatibilityTestsFields } from './compatibility-tests-fields';
import { ComplicationsFields } from './complications-fields';
import { formatComponentUnitNumber } from './component-unit-number';
import { DonorFields } from './donor-fields';
import { IndicationsFields } from './indications-fields';
import { MonitoringFields } from './monitoring-fields';
import { ProtocolFieldControl } from './protocol-field-control';
import { RecipientExaminationFields } from './recipient-examination-fields';
import { RecipientHistoryFields } from './recipient-history-fields';
import { getHemaconExpirationWarning } from './reagent-defaults';
import { SelectionFields } from './selection-fields';
import { persistProtocolOptions } from './saved-field-config';
import styles from './protocol-editor.module.css';
import type { ProtocolBlockId, ProtocolValues } from './protocol-types';

type Props = {
  blockId: ProtocolBlockId;
  values: ProtocolValues;
  bloodGroupWarning: string;
  onDismissBloodGroupWarning: () => void;
  componentUnitNumberWarning: string;
  onDismissComponentUnitNumberWarning: () => void;
  onSave: (values: ProtocolValues) => void;
  onClose: (values: ProtocolValues) => void;
};

const getInitialValues = (blockId: ProtocolBlockId, values: ProtocolValues) => {
  const config = getProtocolBlockConfig(blockId);
  return Object.fromEntries(config.fields.map(({ name }) => [name, values[name] ?? '']));
};

export const ProtocolEditorModal = ({
  blockId,
  values,
  bloodGroupWarning,
  onDismissBloodGroupWarning,
  componentUnitNumberWarning,
  onDismissComponentUnitNumberWarning,
  onSave,
  onClose,
}: Props) => {
  const config = getProtocolBlockConfig(blockId);
  const [draft, setDraft] = useState<ProtocolValues>(() => getInitialValues(blockId, values));
  const hemaconExpirationWarning = getHemaconExpirationWarning(draft.expirationDate);

  useEffect(() => {
    setDraft(getInitialValues(blockId, values));
  }, [blockId, values]);

  const changeValues = (nextValues: ProtocolValues) => {
    setDraft((current) => ({ ...current, ...nextValues }));
    onSave(nextValues);
  };

  const changeValue = (name: string, value: string) => {
    changeValues({ [name]: value });
  };

  const handleClose = () => {
    persistProtocolOptions(draft);
    onClose(draft);
  };

  return (
    <Modal title={config.title} onClose={handleClose} className={styles[config.size]}>
      <div className={[styles.grid, blockId === 'history' ? styles.historyGrid : ''].filter(Boolean).join(' ')}>
        {bloodGroupWarning && (blockId === 'examination' || blockId === 'donor') && (
          <div className={styles.bloodGroupWarning} role="alert">
            <span>{bloodGroupWarning}</span>
            <button
              type="button"
              className={styles.bloodGroupWarningDismiss}
              aria-label="Закрыть предупреждение"
              onClick={onDismissBloodGroupWarning}
            >
              ×
            </button>
          </div>
        )}

        {blockId === 'examination' ? (
          <RecipientExaminationFields values={draft} onChange={changeValues} />
        ) : blockId === 'donor' ? (
          <>
            <DonorFields values={draft} onChange={changeValues} />

            {config.fields
              .filter((field) => field.name === 'componentUnitNumber')
              .map((field) => (
                <div key={field.name} className={styles.componentUnitNumberField}>
                  <label>
                    <span>{field.label}</span>
                    <input
                      name={field.name}
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      maxLength={16}
                      value={formatComponentUnitNumber(draft[field.name])}
                      onChange={(event) =>
                        changeValue(field.name, formatComponentUnitNumber(event.target.value))
                      }
                    />
                  </label>

                  {componentUnitNumberWarning && (
                    <div className={styles.fieldWarning} role="alert">
                      <span>{componentUnitNumberWarning}</span>
                      <button
                        type="button"
                        className={styles.fieldWarningDismiss}
                        aria-label="Закрыть предупреждение"
                        onClick={onDismissComponentUnitNumberWarning}
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              ))}

            {config.fields
              .filter((field) => ['amountMl', 'collectionDate'].includes(field.name))
              .map((field) => (
                <ProtocolFieldControl
                  key={field.name}
                  field={field}
                  value={draft[field.name] ?? ''}
                  onChange={changeValue}
                  onValuesChange={changeValues}
                />
              ))}

            {config.fields
              .filter((field) => field.name === 'expirationDate')
              .map((field) => (
                <div key={field.name} className={styles.componentUnitNumberField}>
                  <ProtocolFieldControl
                    field={field}
                    value={draft[field.name] ?? ''}
                    onChange={changeValue}
                    onValuesChange={changeValues}
                  />

                  {hemaconExpirationWarning && (
                    <div className={styles.fieldWarning} role="alert">
                      <span>{hemaconExpirationWarning}.</span>
                    </div>
                  )}
                </div>
              ))}

            {config.fields
              .filter((field) => field.name === 'collectionOrganization')
              .map((field) => (
                <ProtocolFieldControl
                  key={field.name}
                  field={field}
                  value={draft[field.name] ?? ''}
                  onChange={changeValue}
                  onValuesChange={changeValues}
                />
              ))}
          </>
        ) : blockId === 'indications' ? (
          <IndicationsFields values={draft} onChange={changeValues} />
        ) : blockId === 'history' ? (
          <RecipientHistoryFields values={draft} onChange={changeValues} />
        ) : blockId === 'selection' ? (
          <SelectionFields values={draft} onChange={changeValues} />
        ) : blockId === 'compatibilityTests' ? (
          <CompatibilityTestsFields values={draft} onChange={changeValues} />
        ) : blockId === 'complications' ? (
          <ComplicationsFields values={draft} onChange={changeValues} />
        ) : blockId === 'monitoring' ? (
          <MonitoringFields values={draft} onChange={changeValues} />
        ) : (
          config.fields.map((field) => (
            <ProtocolFieldControl
              key={field.name}
              field={field}
              value={draft[field.name] ?? ''}
              onChange={changeValue}
              onValuesChange={changeValues}
            />
          ))
        )}
      </div>
    </Modal>
  );
};
