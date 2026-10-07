import { useState } from 'react';
import Modal from '../modal/modal';
import { getProtocolBlockConfig } from './editor-config';
import { IndicationsFields } from './indications-fields';
import { ProtocolFieldControl } from './protocol-field-control';
import { RecipientExaminationFields } from './recipient-examination-fields';
import { persistProtocolOptions } from './saved-field-config';
import styles from './protocol-editor.module.css';
import type { ProtocolBlockId, ProtocolValues } from './protocol-types';

type Props = {
  blockId: ProtocolBlockId;
  values: ProtocolValues;
  onSave: (values: ProtocolValues) => void;
  onClose: () => void;
};

const getInitialValues = (blockId: ProtocolBlockId, values: ProtocolValues) => {
  const config = getProtocolBlockConfig(blockId);
  return Object.fromEntries(config.fields.map(({ name }) => [name, values[name] ?? '']));
};

export const ProtocolEditorModal = ({ blockId, values, onSave, onClose }: Props) => {
  const config = getProtocolBlockConfig(blockId);
  const [draft, setDraft] = useState<ProtocolValues>(() => getInitialValues(blockId, values));

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
      <div className={styles.grid}>
        {blockId === 'examination' ? (
          <RecipientExaminationFields values={draft} onChange={changeValues} />
        ) : blockId === 'indications' ? (
          <IndicationsFields values={draft} onChange={changeValues} />
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
