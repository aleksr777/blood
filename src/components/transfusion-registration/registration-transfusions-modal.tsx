import { useEffect, useMemo, useState } from 'react';
import { listProtocolRecords, type ProtocolRecord } from '../../storage/repositories/recipients';
import { transfusionOrderKey } from '../../domain/date-time';
import Modal from '../modal/modal';
import { formatDate } from '../transfusion-protocol/protocol-types';
import {
  buildRegistrationTransfusionRow,
  parseRegistrationTransfusionRows,
  serializeRegistrationTransfusionRows,
  REGISTRATION_TRANSFUSION_ROWS_FIELD,
} from './registration-transfusion-table';
import styles from './registration-transfusions-modal.module.css';
import type { ProtocolValues } from '../transfusion-protocol/protocol-types';

const MAX_ROWS = 14;

type Props = {
  recipientId: number | null;
  values: ProtocolValues;
  onApply: (values: ProtocolValues) => void;
  onClose: () => void;
};

const formatTime = (record: ProtocolRecord) =>
  record.values.startTime || record.values.endTime || '';

const compareRecords = (left: ProtocolRecord, right: ProtocolRecord) =>
  transfusionOrderKey(left.values.transfusionDate, formatTime(left)).localeCompare(
    transfusionOrderKey(right.values.transfusionDate, formatTime(right)),
  ) || left.id - right.id;

const recordLabel = (record: ProtocolRecord) => {
  const values = record.values;
  const dateTime = [formatDate(values.transfusionDate), formatTime(record)]
    .filter(Boolean)
    .join(' ');
  const component = values.componentName?.trim() || 'Компонент не указан';
  const details = [
    values.amountMl?.trim() ? `${values.amountMl.trim()} мл` : '',
    values.componentUnitNumber?.trim() ? `№ ${values.componentUnitNumber.trim()}` : '',
  ]
    .filter(Boolean)
    .join(' · ');

  return { dateTime, component, details };
};

export const RegistrationTransfusionsModal = ({ recipientId, values, onApply, onClose }: Props) => {
  const initialRows = useMemo(() => parseRegistrationTransfusionRows(values), [values]);
  const [records, setRecords] = useState<ProtocolRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState(
    () => new Set(initialRows.map(({ protocolId }) => protocolId)),
  );
  const [loading, setLoading] = useState(Boolean(recipientId));
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (!recipientId) {
      setRecords([]);
      setLoading(false);
      return undefined;
    }

    let active = true;
    setLoading(true);
    setLoadFailed(false);

    void listProtocolRecords(recipientId)
      .then((items) => {
        if (!active) return;
        setRecords([...items].sort(compareRecords));
      })
      .catch((error: unknown) => {
        console.error('Не удалось загрузить протоколы трансфузий:', error);
        if (active) {
          setRecords([]);
          setLoadFailed(true);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [recipientId]);

  const toggleRecord = (recordId: number) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(recordId)) {
        next.delete(recordId);
      } else if (next.size < MAX_ROWS) {
        next.add(recordId);
      }
      return next;
    });
  };

  const apply = () => {
    const selectedRecords = records.filter(({ id }) => selectedIds.has(id));

    const selectedRecordIds = new Set(selectedRecords.map(({ id }) => id));
    const preservedRows = initialRows.filter(
      ({ protocolId }) => selectedIds.has(protocolId) && !selectedRecordIds.has(protocolId),
    );
    const rows = [...preservedRows, ...selectedRecords.map(buildRegistrationTransfusionRow)].slice(
      0,
      MAX_ROWS,
    );

    onApply({
      [REGISTRATION_TRANSFUSION_ROWS_FIELD]: serializeRegistrationTransfusionRows(rows),
    });
    onClose();
  };

  const emptyText = loadFailed
    ? 'Не удалось загрузить сохранённые протоколы.'
    : 'Сохранённых протоколов трансфузий нет.';

  return (
    <Modal title="Трансфузии для листа регистрации" onClose={onClose} className={styles.modal}>
      <div className={styles.root}>
        {!recipientId ? (
          <div className={styles.empty}>Сначала выберите текущего реципиента.</div>
        ) : (
          <>
            <div className={styles.summary}>
              Выбрано: {selectedIds.size} из {MAX_ROWS}
            </div>

            <div className={styles.list}>
              {loading ? (
                <div className={styles.empty}>Загрузка...</div>
              ) : records.length === 0 ? (
                <div className={styles.empty}>{emptyText}</div>
              ) : (
                records.map((record) => {
                  const checked = selectedIds.has(record.id);
                  const disabled = !checked && selectedIds.size >= MAX_ROWS;
                  const label = recordLabel(record);

                  return (
                    <label
                      key={record.id}
                      className={[
                        styles.item,
                        checked ? styles.itemSelected : '',
                        disabled ? styles.itemDisabled : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => toggleRecord(record.id)}
                      />
                      <span className={styles.itemContent}>
                        <span className={styles.itemTopLine}>
                          <strong>{label.component}</strong>
                          <span>{label.dateTime || 'Дата не указана'}</span>
                        </span>
                        {label.details && (
                          <span className={styles.itemDetails}>{label.details}</span>
                        )}
                        {record.values.doctorName?.trim() && (
                          <span className={styles.itemDetails}>
                            Врач: {record.values.doctorName.trim()}
                          </span>
                        )}
                      </span>
                    </label>
                  );
                })
              )}
            </div>

            <div className={styles.actions}>
              <button type="button" className={styles.cancelButton} onClick={onClose}>
                Отмена
              </button>
              <button type="button" className={styles.applyButton} onClick={apply}>
                Внести в таблицу
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
