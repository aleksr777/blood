import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { RecipientDatabaseModal } from '../transfusion-protocol/recipient-database-modal';
import { formatDateTime } from '../transfusion-protocol/protocol-types';
import { SiteNavigation } from '../site-navigation/site-navigation';
import {
  RequestEditorModal,
  type RequestEditorField,
} from './request-editor-modal';
import styles from './request-form.module.css';

const STORAGE_KEY = 'blood:component-request-draft';
const MAX_ROWS = 4;

type RequestRow = {
  recipientIdentity: string;
  medicalRecordNumber: string;
  recipientAbo: string;
  recipientRh: string;
  recipientAntigens: string;
  componentCode: string;
  quantity: string;
  indicationCode: string;
  individualSelection: string;
  individualSelectionCode: string;
  donorAbo: string;
  donorRhAntigens: string;
};

type Draft = {
  department: string;
  requestDateTime: string;
  plannedDateTime: string;
  careForm: 'urgent' | 'planned' | '';
  doctorName: string;
  rows: RequestRow[];
};

type Editor =
  | { kind: 'details' }
  | { kind: 'row'; index: number }
  | { kind: 'doctor' }
  | null;

const DETAIL_FIELDS: RequestEditorField[] = [
  {
    name: 'department',
    label:
      'Наименование и контактный телефон подразделения медицинской организации, осуществляющего клиническое использование донорской крови и (или) ее компонентов',
    wide: true,
  },
  {
    name: 'requestDateTime',
    label: 'Дата и время подачи заявки',
    type: 'datetime-local',
  },
  {
    name: 'plannedDateTime',
    label: 'Предполагаемые дата и время трансфузии',
    type: 'datetime-local',
  },
  {
    name: 'careForm',
    label: 'Форма оказания медицинской помощи',
    type: 'select',
    options: [
      { value: 'urgent', label: 'Экстренная или неотложная' },
      { value: 'planned', label: 'Плановая трансфузия' },
    ],
    wide: true,
  },
];

const ROW_FIELDS: RequestEditorField[] = [
  {
    name: 'recipientIdentity',
    label: 'ФИО, дата рождения и диагноз реципиента',
    type: 'textarea',
    wide: true,
  },
  { name: 'medicalRecordNumber', label: '№ медицинской карты' },
  { name: 'recipientAbo', label: 'Группа крови AB0' },
  { name: 'recipientRh', label: 'Резус-принадлежность' },
  {
    name: 'recipientAntigens',
    label: 'Антигены эритроцитов C, c, E, e, K, k, антигены других систем',
    type: 'textarea',
    wide: true,
  },
  {
    name: 'componentCode',
    label: 'Идентификационный код донорской крови и (или) ее компонента',
    wide: true,
  },
  { name: 'quantity', label: 'Количество (единицы измерения)' },
  { name: 'indicationCode', label: 'Код показания к трансфузии' },
  {
    name: 'individualSelection',
    label: 'Необходимость индивидуального подбора',
    type: 'select',
    options: [
      { value: 'Да', label: 'Да' },
      { value: 'Нет', label: 'Нет' },
    ],
  },
  {
    name: 'individualSelectionCode',
    label: 'Код показания для индивидуального подбора',
  },
  {
    name: 'donorAbo',
    label: 'Группа крови по системе AB0 донора аллогенного КМ или ГСК',
    wide: true,
  },
  {
    name: 'donorRhAntigens',
    label:
      'Резус-принадлежность и антигены эритроцитов C, c, E, e, K, k донора аллогенного КМ или ГСК',
    type: 'textarea',
    wide: true,
  },
];

const DOCTOR_FIELDS: RequestEditorField[] = [
  {
    name: 'doctorName',
    label: 'Врач, проводящий трансфузию',
    wide: true,
  },
];

const emptyRow = (): RequestRow => ({
  recipientIdentity: '',
  medicalRecordNumber: '',
  recipientAbo: '',
  recipientRh: '',
  recipientAntigens: '',
  componentCode: '',
  quantity: '',
  indicationCode: '',
  individualSelection: '',
  individualSelectionCode: '',
  donorAbo: '',
  donorRhAntigens: '',
});

const initialDraft = (): Draft => ({
  department: '',
  requestDateTime: '',
  plannedDateTime: '',
  careForm: '',
  doctorName: '',
  rows: [emptyRow()],
});

const loadDraft = (): Draft => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialDraft();
    const parsed = JSON.parse(raw) as Partial<Draft>;
    return {
      ...initialDraft(),
      ...parsed,
      careForm:
        parsed.careForm === 'urgent' || parsed.careForm === 'planned'
          ? parsed.careForm
          : '',
      rows:
        Array.isArray(parsed.rows) && parsed.rows.length > 0
          ? parsed.rows.map((row) => ({ ...emptyRow(), ...row })).slice(0, MAX_ROWS)
          : [emptyRow()],
    };
  } catch {
    return initialDraft();
  }
};

const activateOnKeyboard = (
  event: KeyboardEvent<HTMLElement>,
  action: () => void,
) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    action();
  }
};

const displayValue = (value?: string) => value?.trim() || ' ';

const careFormText = (value: Draft['careForm']) => {
  if (value === 'urgent') return 'экстренная или неотложная';
  if (value === 'planned') return 'плановая трансфузия';
  return '';
};

export const ComponentRequest = () => {
  const [draft, setDraft] = useState<Draft>(loadDraft);
  const [editor, setEditor] = useState<Editor>(null);
  const [registryOpen, setRegistryOpen] = useState(false);
  const [status, setStatus] = useState('');
  const sheetsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [draft]);

  const updateFields = (changes: Record<string, string>) => {
    setDraft((current) => ({
      ...current,
      department: changes.department ?? current.department,
      requestDateTime: changes.requestDateTime ?? current.requestDateTime,
      plannedDateTime: changes.plannedDateTime ?? current.plannedDateTime,
      doctorName: changes.doctorName ?? current.doctorName,
      careForm:
        changes.careForm === 'urgent' || changes.careForm === 'planned'
          ? changes.careForm
          : changes.careForm === ''
            ? ''
            : current.careForm,
    }));
  };

  const updateRow = (index: number, changes: Record<string, string>) => {
    setDraft((current) => ({
      ...current,
      rows: current.rows.map((row, rowIndex) => {
        if (rowIndex !== index) return row;
        const next = { ...row };
        Object.entries(changes).forEach(([name, value]) => {
          if (name in next) next[name as keyof RequestRow] = value;
        });
        return next;
      }),
    }));
  };

  const addRow = () => {
    setDraft((current) =>
      current.rows.length >= MAX_ROWS
        ? current
        : { ...current, rows: [...current.rows, emptyRow()] },
    );
  };

  const clear = () => {
    const next = initialDraft();
    setDraft(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setStatus('');
  };

  const newBlank = () => {
    const next = initialDraft();
    setDraft(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setStatus('Создан новый бланк.');
  };

  const save = (afterPrint = false) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    setStatus(afterPrint ? 'Заявка сохранена после печати.' : 'Заявка сохранена.');
  };

  const printPage = (pageIndex: number) => {
    const sheets = Array.from(
      sheetsRef.current?.querySelectorAll<HTMLElement>(`.${styles.sheet}`) ?? [],
    );

    sheets.forEach((sheet, index) => {
      if (index !== pageIndex) sheet.dataset.printHidden = 'true';
    });

    const afterPrint = () => {
      sheets.forEach((sheet) => delete sheet.dataset.printHidden);
      window.removeEventListener('afterprint', afterPrint);
      save(true);
    };

    window.addEventListener('afterprint', afterPrint);
    window.print();
  };

  const detailValues: Record<string, string> = {
    department: draft.department,
    requestDateTime: draft.requestDateTime,
    plannedDateTime: draft.plannedDateTime,
    careForm: draft.careForm,
  };

  return (
    <main className={styles.shell}>
      <header className={`app-header ${styles.header}`}>
        <div className={`toolbar-wrap ${styles.toolbar}`}>
          <SiteNavigation current="component-request" showRecipient={false} />
          <div className="print-actions" aria-label="Панель действий">
            <button type="button" className="clear-button" onClick={clear}>
              Очистить бланк
            </button>
            <button type="button" className="new-button" onClick={newBlank}>
              Новый бланк
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setRegistryOpen(true)}
            >
              Реципиенты
            </button>
            <button type="button" className="save-button" onClick={() => save()}>
              Сохранить
            </button>
            <button
              type="button"
              className="print-button"
              onClick={() => printPage(0)}
            >
              Печать страницы 1
            </button>
            <button
              type="button"
              className="print-button"
              onClick={() => printPage(1)}
            >
              Печать страницы 2
            </button>
          </div>
          {status && (
            <div className="toolbar-status" role="status">
              {status}
            </div>
          )}
        </div>
      </header>

      <div className={styles.addRowBar}>
        <button
          type="button"
          className={styles.addRowButton}
          disabled={draft.rows.length >= MAX_ROWS}
          onClick={addRow}
        >
          Добавить строку
        </button>
      </div>

      <div ref={sheetsRef} className={styles.sheets}>
        <section className={styles.sheet} aria-label="Заявка на компоненты, страница 1">
          <div className={styles.legal}>
            <div>Приложение № 17</div>
            <div>к приказу Министерства здравоохранения</div>
            <div>Российской Федерации</div>
            <div>от 18 мая 2026 г. № 447н</div>
            <br />
            <div>Унифицированная форма</div>
            <div>медицинской документации</div>
            <div>утверждена приказом</div>
            <div>Министерства здравоохранения</div>
            <div>Российской Федерации</div>
            <div>от 18 мая 2026 г. № 447н</div>
          </div>

          <h1 className={`${styles.title} ${styles.titleCompact}`}>
            ЗАЯВКА
            <br />
            на донорскую кровь и ее компоненты из структурного подразделения медицинской
            организации в кабинет трансфузиологии, отделение трансфузиологии (отделение
            переливания крови)
            <br />
            для клинического использования
          </h1>

          <table
            className={`${styles.topTable} ${styles.fillSection}`}
            role="button"
            tabIndex={0}
            onClick={() => setEditor({ kind: 'details' })}
            onKeyDown={(event) =>
              activateOnKeyboard(event, () => setEditor({ kind: 'details' }))
            }
          >
            <tbody>
              <tr>
                <td>
                  Наименование и контактный телефон подразделения медицинской организации,
                  осуществляющего клиническое использование донорской крови и (или) ее компонентов
                </td>
                <td>{displayValue(draft.department)}</td>
              </tr>
              <tr>
                <td>Дата и время подачи заявки</td>
                <td>{formatDateTime(draft.requestDateTime) || ' '}</td>
              </tr>
              <tr>
                <td>Предполагаемые дата и время трансфузии</td>
                <td>{formatDateTime(draft.plannedDateTime) || ' '}</td>
              </tr>
              <tr>
                <td>Форма оказания медицинской помощи (нужное подчеркнуть)</td>
                <td className={styles.careFormValue}>
                  {displayValue(careFormText(draft.careForm))}
                </td>
              </tr>
              <tr className={styles.sectionHeaderRow}>
                <td>Заполняется врачом, проводящим трансфузию</td>
                <td>
                  Сведение о доноре костного мозга или гемопоэтических стволовых клеток
                  (заполняется в случае проведения трансплантации аллогенного костного мозга или
                  гемопоэтических стволовых клеток)
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className={styles.sheet} aria-label="Заявка на компоненты, страница 2">
          <div className={styles.pageNumber}>2</div>
          <table className={`${styles.table} ${styles.requestTable}`}>
            <thead>
              <tr className={styles.tableHeaderTall}>
                <th>
                  Фамилия, имя, отчество (при наличии), дата рождения и диагноз реципиента
                </th>
                <th>№ медицинской карты</th>
                <th>Группа крови AB0</th>
                <th>Резус-принадлежность</th>
                <th>Антигены эритроцитов C, c, E, e, K, k, антигены других систем</th>
                <th>Идентификационный код донорской крови и (или) ее компонента</th>
                <th>Количество (единицы измерения)</th>
                <th>Код показания к трансфузии</th>
                <th>Необходимость индивидуального подбора (да/нет)</th>
                <th>Код показания для индивидуального подбора</th>
                <th>Группа крови по системе AB0 донора аллогенного КМ или ГСК</th>
                <th>
                  Резус-принадлежность и антигены эритроцитов C, c, E, e, K, k донора аллогенного
                  КМ или ГСК
                </th>
              </tr>
              <tr className={styles.tableNumberRow}>
                {Array.from({ length: 12 }, (_, index) => (
                  <th key={index}>{index + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {draft.rows.map((row, index) => (
                <tr
                  key={index}
                  className={`${styles.dataRow} ${styles.fillRow}`}
                  tabIndex={0}
                  onClick={() => setEditor({ kind: 'row', index })}
                  onKeyDown={(event) =>
                    activateOnKeyboard(event, () => setEditor({ kind: 'row', index }))
                  }
                >
                  <td>{displayValue(row.recipientIdentity)}</td>
                  <td>{displayValue(row.medicalRecordNumber)}</td>
                  <td>{displayValue(row.recipientAbo)}</td>
                  <td>{displayValue(row.recipientRh)}</td>
                  <td>{displayValue(row.recipientAntigens)}</td>
                  <td>{displayValue(row.componentCode)}</td>
                  <td>{displayValue(row.quantity)}</td>
                  <td>{displayValue(row.indicationCode)}</td>
                  <td>{displayValue(row.individualSelection)}</td>
                  <td>{displayValue(row.individualSelectionCode)}</td>
                  <td>{displayValue(row.donorAbo)}</td>
                  <td>{displayValue(row.donorRhAntigens)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div
            className={`${styles.doctorSignature} ${styles.fillSection}`}
            role="button"
            tabIndex={0}
            onClick={() => setEditor({ kind: 'doctor' })}
            onKeyDown={(event) =>
              activateOnKeyboard(event, () => setEditor({ kind: 'doctor' }))
            }
          >
            <span>Врач, проводящий трансфузию,</span>
            <div>
              <div className={styles.doctorNameValue}>
                {displayValue(draft.doctorName)}
              </div>
              <div className={styles.signatureCaption}>
                фамилия, имя, отчество
                <br />
                (при наличии)
              </div>
            </div>
            <div>
              <div className={styles.signatureLine} />
              <div className={styles.signatureCaption}>подпись</div>
            </div>
          </div>
        </section>
      </div>

      {editor?.kind === 'details' && (
        <RequestEditorModal
          title="Общие данные заявки"
          fields={DETAIL_FIELDS}
          values={detailValues}
          onChange={updateFields}
          onClose={() => setEditor(null)}
        />
      )}

      {editor?.kind === 'row' && (
        <RequestEditorModal
          title={`Строка ${editor.index + 1} заявки`}
          fields={ROW_FIELDS}
          values={draft.rows[editor.index] ?? emptyRow()}
          onChange={(changes) => updateRow(editor.index, changes)}
          onClose={() => setEditor(null)}
        />
      )}

      {editor?.kind === 'doctor' && (
        <RequestEditorModal
          title="Врач, проводящий трансфузию"
          fields={DOCTOR_FIELDS}
          values={{ doctorName: draft.doctorName }}
          onChange={updateFields}
          onClose={() => setEditor(null)}
        />
      )}

      {registryOpen && (
        <RecipientDatabaseModal onClose={() => setRegistryOpen(false)} />
      )}
    </main>
  );
};
