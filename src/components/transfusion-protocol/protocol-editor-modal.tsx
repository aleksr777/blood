import { useEffect, useState } from 'react';
import Modal from '../modal/modal';
import { getProtocolBlockConfig } from './editor-config';
import { CompatibilityTestsFields } from './compatibility-tests-fields';
import { ComplicationsFields } from './complications-fields';
import { DonorFields } from './donor-fields';
import { IndicationsFields } from './indications-fields';
import { MonitoringFields } from './monitoring-fields';
import { ProtocolFieldControl } from './protocol-field-control';
import { RecipientExaminationFields } from './recipient-examination-fields';
import { RecipientHistoryFields } from './recipient-history-fields';
import { SelectionFields } from './selection-fields';
import { persistProtocolOptions } from './saved-field-config';
import styles from './protocol-editor.module.css';
import type { ProtocolBlockId, ProtocolValues } from './protocol-types';

type Props = {
  blockId: ProtocolBlockId;
  values: ProtocolValues;
  bloodGroupWarning: string;
  onDismissBloodGroupWarning: () => void;
  onSave: (values: ProtocolValues) => void;
  onClose: () => void;
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
  onSave,
  onClose,
}: Props) => {
  const config = getProtocolBlockConfig(blockId);
  const [draft, setDraft] = useState<ProtocolValues>(() => getInitialValues(blockId, values));

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
    onClose();
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
              .filter((field) =>
                ['componentUnitNumber', 'amountMl', 'collectionDate', 'expirationDate'].includes(
                  field.name,
                ),
              )
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
