import { useEffect, useState } from 'react';
import { DEFAULTED_RADIO_FIELDS } from '../../domain/form-content';
import Modal from '../modal/modal';
import { WarningNotice } from '../warning-notice/warning-notice';
import { getProtocolBlockConfig, isDonorComponentBlock } from './editor-config';
import { CompatibilityTestsFields } from './compatibility-tests-fields';
import { ComplicationsFields } from './complications-fields';
import { DonorComponentFields } from './donor-component-fields';
import { MonitoringFields } from './monitoring-fields';
import { PatientDetailsFields } from './patient-details-fields';
import { ProtocolFieldControl } from './protocol-field-control';
import { RecipientExaminationSection } from './recipient-input-sections';
import { RecipientHistoryModal } from './recipient-history-modal';
import { SelectionFields } from './selection-fields';
import styles from './protocol-editor.module.css';
import type { RecipientRecord } from '../../storage/repositories/recipients';
import type { ProtocolBlockId, ProtocolFieldConfig, ProtocolValues } from './protocol-types';

type Props = {
  blockId: ProtocolBlockId;
  values: ProtocolValues;
  savedDocument?: boolean;
  archivedRecipientAge?: string;
  bloodGroupWarning: string;
  bloodGroupWarningDismissible: boolean;
  onDismissBloodGroupWarning: () => void;
  componentUnitNumberWarning: string;
  onDismissComponentUnitNumberWarning: () => void;
  previousTransfusionSuggestion: string;
  persistReusableOptions: boolean;
  onOpenRecipients: () => void;
  onSelectRecipient: (recipient: RecipientRecord) => void | boolean | Promise<void | boolean>;
  onSave: (values: ProtocolValues) => void;
  onClose: (values: ProtocolValues) => void;
};

const getInitialValues = (blockId: ProtocolBlockId, values: ProtocolValues) => {
  const config = getProtocolBlockConfig(blockId);
  return Object.fromEntries(
    config.fields.flatMap(({ name }) =>
      DEFAULTED_RADIO_FIELDS.has(name) && !(name in values) ? [] : [[name, values[name] ?? '']],
    ),
  );
};

export const ProtocolEditorModal = ({
  blockId,
  values,
  savedDocument = false,
  archivedRecipientAge = '',
  bloodGroupWarning,
  bloodGroupWarningDismissible,
  onDismissBloodGroupWarning,
  componentUnitNumberWarning,
  onDismissComponentUnitNumberWarning,
  previousTransfusionSuggestion,
  onOpenRecipients,
  onSelectRecipient,
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

  const handleClose = () => onClose(draft);

  const handleOpenRecipients = () => {
    onClose(draft);
    onOpenRecipients();
  };

  const renderStandardField = (field: ProtocolFieldConfig) => (
    <ProtocolFieldControl
      savedDocument={savedDocument}
      key={field.name}
      field={field}
      value={draft[field.name] ?? ''}
      onChange={changeValue}
      onOpenRecipients={handleOpenRecipients}
      onSelectRecipient={onSelectRecipient}
    />
  );

  const renderGeneralGroup = (title: string, fieldNames: string[], transfusion = false) => (
    <fieldset className={styles.generalGroup}>
      <legend>{title}</legend>
      <div className={`${styles.generalGroupGrid} ${transfusion ? styles.transfusionGrid : ''}`}>
        {fieldNames.flatMap((fieldName) => {
          const field = config.fields.find(({ name }) => name === fieldName);
          if (!field) return [];

          return [renderStandardField(field)];
        })}
      </div>
    </fieldset>
  );

  if (blockId === 'history') {
    return (
      <RecipientHistoryModal
        values={draft}
        savedDocument={savedDocument}
        previousTransfusionSuggestion={previousTransfusionSuggestion}
        onChange={changeValues}
        onClose={handleClose}
      />
    );
  }

  return (
    <Modal title={config.title} onClose={handleClose} className={styles[config.size]}>
      <div className={styles.grid}>
        {(blockId === 'examination' || isDonorComponentBlock(blockId)) && (
          <WarningNotice
            className={styles.bloodGroupWarning}
            message={bloodGroupWarning}
            dismissible={bloodGroupWarningDismissible}
            onDismiss={onDismissBloodGroupWarning}
          />
        )}

        {blockId === 'general' ? (
          <>
            <PatientDetailsFields
              values={{ ...draft, recipientId: values.recipientId }}
              onChange={changeValues}
              savedDocument={savedDocument}
              archivedAge={archivedRecipientAge}
              ageReferenceDate={draft.transfusionDate}
              onOpenRecipients={handleOpenRecipients}
              onSelectRecipient={onSelectRecipient}
            />
            {renderGeneralGroup(
              'Данные трансфузии',
              ['requestDateTime', 'transfusionDate', 'startTime', 'endTime'],
              true,
            )}
          </>
        ) : blockId === 'examination' ? (
          <RecipientExaminationSection values={draft} onChange={changeValues} showTitle={false} />
        ) : isDonorComponentBlock(blockId) ? (
          <DonorComponentFields
            fields={config.fields}
            values={draft}
            onChange={changeValues}
            savedDocument={savedDocument}
            componentUnitNumberWarning={componentUnitNumberWarning}
            onDismissComponentUnitNumberWarning={onDismissComponentUnitNumberWarning}
          />
        ) : blockId === 'selection' ? (
          <SelectionFields values={draft} onChange={changeValues} />
        ) : blockId === 'compatibilityTests' ? (
          <CompatibilityTestsFields
            values={draft}
            onChange={changeValues}
            applyDefaults={!savedDocument}
          />
        ) : blockId === 'complications' ? (
          <ComplicationsFields
            values={draft}
            onChange={changeValues}
            applyDefaults={!savedDocument}
          />
        ) : blockId === 'monitoring' ? (
          <MonitoringFields values={draft} onChange={changeValues} />
        ) : (
          config.fields.map(renderStandardField)
        )}
      </div>
    </Modal>
  );
};
