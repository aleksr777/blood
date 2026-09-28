import { useState } from 'react';
import Modal from '../modal/modal';
import { getProtocolBlockConfig } from './editor-config';
import { ProtocolFieldControl } from './protocol-field-control';
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

  const changeValue = (name: string, value: string) => {
    setDraft((current) => ({ ...current, [name]: value }));
  };

  const handleClose = () => {
    persistProtocolOptions(draft);
    onSave(draft);
    onClose();
  };

  return (
    <Modal title={config.title} onClose={handleClose} className={styles[config.size]}>
      <div className={styles.grid}>
        {config.fields.map((field) => (
          <ProtocolFieldControl
            key={field.name}
            field={field}
            value={draft[field.name] ?? ''}
            onChange={changeValue}
          />
        ))}
      </div>
    </Modal>
  );
};
