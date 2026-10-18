import { useEffect, useMemo, useState } from 'react';
import {
  listProtocolRecords,
  type ProtocolRecord,
} from '../../storage/repositories/recipients';
import Modal from '../modal/modal';
import { formatDate } from '../transfusion-protocol/protocol-types';
import {
  buildRegistrationTransfusionRow,
  getProtocolTransfusionTimestamp,
  hasRegistrationTransfusionData,
  parseRegistrationTransfusionRows,
  serializeRegistrationTransfusionRows,
  REGISTRATION_TRANSFUSION_ROWS_FIELD,
} from './registration-transfusion-table';
import styles from './registration-transfusions-modal.module.css';
import type { ProtocolValues } from '../transfusion-protocol/protocol-types';

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_ROWS = 14;

type Props = {
  recipientId: number | null;
  values: ProtocolValues;
  onApply: (values: ProtocolValues) => void;
  onClose: () => void;
};

const formatTime = (record: ProtocolRecord) =>
  record.values.endTime || record.values.startTime || '';

const recordLabel = (record: ProtocolRecord) => {
  const values = record.values;
  const dateTime = [
    formatDate(values.transfusionDate),
    formatTime(record),
  ].filter(Boolean).join(' ');
  const component = values.componentName?.trim() || 'Компонент не указан';
  const details = [
    values.amountMl?.trim() ? `${values.amountMl.trim()} мл` : '',
    values.componentUnitNumber?.trim()
      ? `№ ${values.componentUnitNumber.trim()}`
      : '',
  ].filter(Boolean).join(' · ');

  return { dateTime, component, details };
};

export const RegistrationTransfusionsModal = ({
  recipientId,
  values,
  onApply,
  onClose,
}: Props) => {
  const initialRows = useMemo(
    () => parseRegistrationTransfusionRows(values),
    [values],
  );
  const [records, setRecords] = useState<ProtocolRecord[]>([]);
  const [periodDays, setPeriodDays] = useState('1');
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
        setRecords(items.filter(hasRegistrationTransfusionData));
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

  const days = Math.max(1, Number.parseInt(periodDays, 10) || 1);
  const cutoff = Date.now() - days * DAY_MS;

  const visibleRecords = useMemo(
    () =>
      records
        .filter((record) => {
          const timestamp = getProtocolTransfusionTimestamp(record);
          return timestamp >= cutoff || selectedIds.has(record.id);
        })
        .sort(
          (left, right) =>
            getProtocolTransfusionTimestamp(right) -
            getProtocolTransfusionTimestamp(left),
        ),
    [cutoff, records, selectedIds],
  );

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
    const selectedRecords = records
      .filter(({ id }) => selectedIds.has(id))
      .sort(
        (left, right) =>
          getProtocolTransfusionTimestamp(left) -
          getProtocolTransfusionTimestamp(right),
      );

    const selectedRecordIds = new Set(selectedRecords.map(({ id }) => id));
    const preservedRows = initialRows.filter(
      ({ protocolId }) =>
        selectedIds.has(protocolId) && !selectedRecordIds.has(protocolId),
    );
    const rows = [
      ...preservedRows,
      ...selectedRecords.map(buildRegistrationTransfusionRow),
    ].slice(0, MAX_ROWS);

    onApply({
      [REGISTRATION_TRANSFUSION_ROWS_FIELD]:
        serializeRegistrationTransfusionRows(rows),
    });
    onClose();
  };

  const emptyText = loadFailed
    ? 'Не удалось загрузить сохранённые протоколы.'
    : 'За выбранный период сохранённых протоколов трансфузий нет.';

  return (
    <Modal
      title="Трансфузии для листа регистрации"
      onClose={onClose}
      className={styles.modal}
    >
      <div className={styles.root}>
        {!recipientId ? (
          <div className={styles.empty}>Сначала выберите текущего реципиента.</div>
        ) : (
          <>
            <div className={styles.filterRow}>
              <label className={styles.periodField}>
                <span>Период, суток</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={periodDays}
                  onChange={(event) => setPeriodDays(event.target.value)}
                />
              </label>
              <div className={styles.filterHint}>
                По умолчанию показаны трансфузии за последние 24 часа.
              </div>
            </div>

            <div className={styles.summary}>
              Выбрано: {selectedIds.size} из {MAX_ROWS}
            </div>

            <div className={styles.list}>
              {loading ? (
                <div className={styles.empty}>Загрузка...</div>
              ) : visibleRecords.length === 0 ? (
                <div className={styles.empty}>{emptyText}</div>
              ) : (
                visibleRecords.map((record) => {
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
                      ].filter(Boolean).join(' ')}
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
