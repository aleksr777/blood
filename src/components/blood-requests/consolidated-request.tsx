import { useEffect, useState, type KeyboardEvent } from 'react';
import { formatDate } from '../transfusion-protocol/protocol-types';
import { SiteNavigation } from '../site-navigation/site-navigation';
import {
  RequestEditorModal,
  type RequestEditorField,
} from './request-editor-modal';
import styles from './request-form.module.css';

const STORAGE_KEY = 'blood:summary-request-draft';
const MAX_ROWS = 5;

type RequestRow = {
  donorAbo: string;
  donorRh: string;
  donorAntigens: string;
  componentName: string;
  quantity: string;
  individualSelection: string;
  recipientIdentity: string;
  recipientAbo: string;
  recipientRh: string;
  recipientAntigens: string;
  selectionIndications: string;
};

type Draft = {
  organization: string;
  transfusionHeadPhone: string;
  supplier: string;
  requestDate: string;
  transfusionHeadName: string;
  organizationHeadName: string;
  rows: RequestRow[];
};

type Editor =
  | { kind: 'details' }
  | { kind: 'row'; index: number }
  | { kind: 'signatures' }
  | null;

const DETAIL_FIELDS: RequestEditorField[] = [
  {
    name: 'organization',
    label:
      'Наименование и контактный телефон медицинской организации, осуществляющей клиническое использование донорской крови и (или) ее компонентов',
    wide: true,
  },
  {
    name: 'transfusionHeadPhone',
    label:
      'Контактный телефон заведующего кабинетом трансфузиологии (отделением переливания крови (отделением трансфузиологии))',
    wide: true,
  },
  {
    name: 'supplier',
    label:
      'Наименование и контактный телефон медицинской организации, осуществляющей заготовку донорской крови и (или) ее компонентов',
    wide: true,
  },
  {
    name: 'requestDate',
    label: 'Дата подачи сводной заявки',
    type: 'date',
  },
];

const ROW_FIELDS: RequestEditorField[] = [
  { name: 'donorAbo', label: 'Группа крови AB0', wide: false },
  { name: 'donorRh', label: 'Резус-принадлежность' },
  {
    name: 'donorAntigens',
    label: 'Антигены эритроцитов C, c, E, e, K, k, антигены других систем',
    type: 'textarea',
    wide: true,
  },
  {
    name: 'componentName',
    label: 'Наименование компонента донорской крови',
    wide: true,
  },
  { name: 'quantity', label: 'Количество (ед/мл)' },
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
    name: 'recipientIdentity',
    label: 'ФИО, дата рождения и диагноз реципиента',
    type: 'textarea',
    wide: true,
  },
  { name: 'recipientAbo', label: 'Группа крови AB0 реципиента' },
  { name: 'recipientRh', label: 'Резус-принадлежность реципиента' },
  {
    name: 'recipientAntigens',
    label:
      'Антигены эритроцитов C, c, E, e, K, k реципиента, антигены других систем',
    type: 'textarea',
    wide: true,
  },
  {
    name: 'selectionIndications',
    label: 'Показания для индивидуального подбора',
    type: 'textarea',
    wide: true,
  },
];

const SIGNATURE_FIELDS: RequestEditorField[] = [
  {
    name: 'transfusionHeadName',
    label:
      'Заведующий кабинетом трансфузиологии (отделением переливания крови / отделением трансфузиологии)',
    wide: true,
  },
  {
    name: 'organizationHeadName',
    label: 'Руководитель (заместитель руководителя) медицинской организации',
    wide: true,
  },
];

const emptyRow = (): RequestRow => ({
  donorAbo: '',
  donorRh: '',
  donorAntigens: '',
  componentName: '',
  quantity: '',
  individualSelection: '',
  recipientIdentity: '',
  recipientAbo: '',
  recipientRh: '',
  recipientAntigens: '',
  selectionIndications: '',
});

const initialDraft = (): Draft => ({
  organization: '',
  transfusionHeadPhone: '',
  supplier: '',
  requestDate: '',
  transfusionHeadName: '',
  organizationHeadName: '',
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

export const ConsolidatedRequest = () => {
  const [draft, setDraft] = useState<Draft>(loadDraft);
  const [editor, setEditor] = useState<Editor>(null);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [draft]);

  const updateFields = (changes: Record<string, string>) => {
    setDraft((current) => ({
      ...current,
      organization: changes.organization ?? current.organization,
      transfusionHeadPhone:
        changes.transfusionHeadPhone ?? current.transfusionHeadPhone,
      supplier: changes.supplier ?? current.supplier,
      requestDate: changes.requestDate ?? current.requestDate,
      transfusionHeadName:
        changes.transfusionHeadName ?? current.transfusionHeadName,
      organizationHeadName:
        changes.organizationHeadName ?? current.organizationHeadName,
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
  };

  const detailValues = {
    organization: draft.organization,
    transfusionHeadPhone: draft.transfusionHeadPhone,
    supplier: draft.supplier,
    requestDate: draft.requestDate,
  };

  const signatureValues = {
    transfusionHeadName: draft.transfusionHeadName,
    organizationHeadName: draft.organizationHeadName,
  };

  return (
    <main className={styles.shell}>
      <header className={`app-header ${styles.header}`}>
        <div className={`toolbar-wrap ${styles.toolbar}`}>
          <SiteNavigation current="summary-request" showRecipient={false} />
          <div className="print-actions">
            <button type="button" className="clear-button" onClick={clear}>
              Очистить бланк
            </button>
            <button type="button" className="print-button" onClick={() => window.print()}>
              Печать
            </button>
          </div>
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

      <div className={styles.sheets}>
        <section className={styles.sheet} aria-label="Сводная заявка, страница 1">
          <div className={styles.legal}>
            <div>Приложение № 9</div>
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

          <h1 className={styles.title}>
            СВОДНАЯ ЗАЯВКА
            <br />
            на донорскую кровь и ее компоненты для клинического использования
          </h1>

          <div
            className={styles.fillSection}
            role="button"
            tabIndex={0}
            onClick={() => setEditor({ kind: 'details' })}
            onKeyDown={(event) =>
              activateOnKeyboard(event, () => setEditor({ kind: 'details' }))
            }
          >
            <div className={styles.formLines}>
              <div className={styles.lineField}>
                <span className={styles.label}>
                  Наименование и контактный телефон медицинской организации, осуществляющей
                  клиническое использование донорской крови и (или) ее компонентов
                </span>
                <div className={styles.lineValue}>{displayValue(draft.organization)}</div>
              </div>

              <div className={styles.lineField}>
                <span className={styles.label}>
                  Контактный телефон заведующего кабинетом трансфузиологии (отделением переливания
                  крови (отделением трансфузиологии))
                </span>
                <div className={styles.lineValue}>{displayValue(draft.transfusionHeadPhone)}</div>
              </div>

              <div className={styles.lineField}>
                <span className={styles.label}>
                  Наименование и контактный телефон медицинской организации, осуществляющей
                  заготовку донорской крови и (или) ее компонентов
                </span>
                <div className={styles.lineValue}>{displayValue(draft.supplier)}</div>
              </div>
            </div>

            <div className={styles.dateRow}>
              <div className={styles.dateField}>
                <span className={styles.label}>Дата подачи сводной заявки</span>
                <div className={`${styles.lineValue} ${styles.dateValue}`}>
                  {formatDate(draft.requestDate) || ' '}
                </div>
              </div>
              <div className={styles.noteBox}>
                Для проведения индивидуального подбора компонентов крови
              </div>
            </div>
          </div>
        </section>

        <section className={styles.sheet} aria-label="Сводная заявка, страница 2">
          <div className={styles.pageNumber}>2</div>
          <table className={styles.table}>
            <thead>
              <tr className={styles.tableHeaderTall}>
                <th>№ п/п</th>
                <th>Группа крови AB0</th>
                <th>Резус-принадлежность</th>
                <th>Антигены эритроцитов C, c, E, e, K, k, антигены других систем</th>
                <th>Наименование компонента донорской крови</th>
                <th>Количество (ед/мл)</th>
                <th>Необходимость индивидуального подбора (да/нет)</th>
                <th>Фамилия, имя, отчество (при наличии), дата рождения и диагноз реципиента</th>
                <th>Группа крови AB0 реципиента</th>
                <th>Резус-принадлежность реципиента</th>
                <th>
                  Антигены эритроцитов C, c, E, e, K, k реципиента, антигены других систем (при их
                  определении)
                </th>
                <th>Показания для индивидуального подбора</th>
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
                  <td>{index + 1}</td>
                  <td>{displayValue(row.donorAbo)}</td>
                  <td>{displayValue(row.donorRh)}</td>
                  <td>{displayValue(row.donorAntigens)}</td>
                  <td>{displayValue(row.componentName)}</td>
                  <td>{displayValue(row.quantity)}</td>
                  <td>{displayValue(row.individualSelection)}</td>
                  <td>{displayValue(row.recipientIdentity)}</td>
                  <td>{displayValue(row.recipientAbo)}</td>
                  <td>{displayValue(row.recipientRh)}</td>
                  <td>{displayValue(row.recipientAntigens)}</td>
                  <td>{displayValue(row.selectionIndications)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div
            className={`${styles.signatureArea} ${styles.fillSection}`}
            role="button"
            tabIndex={0}
            onClick={() => setEditor({ kind: 'signatures' })}
            onKeyDown={(event) =>
              activateOnKeyboard(event, () => setEditor({ kind: 'signatures' }))
            }
          >
            <div className={styles.signatureRow}>
              <div>
                Заведующий кабинетом трансфузиологии
                <br />
                (отделением переливания крови
                <br />
                (отделением трансфузиологии))
              </div>
              <div>
                <div className={styles.signatureLine} />
                <div className={styles.signatureCaption}>подпись</div>
              </div>
              <div>
                <div className={styles.signatureNameValue}>
                  {displayValue(draft.transfusionHeadName)}
                </div>
                <div className={styles.signatureCaption}>
                  фамилия, имя,
                  <br />
                  отчество (при наличии)
                </div>
              </div>
            </div>

            <div className={styles.signatureRow}>
              <div>
                Руководитель (заместитель руководителя)
                <br />
                медицинской организации
              </div>
              <div>
                <div className={styles.signatureLine} />
                <div className={styles.signatureCaption}>подпись</div>
              </div>
              <div>
                <div className={styles.signatureNameValue}>
                  {displayValue(draft.organizationHeadName)}
                </div>
                <div className={styles.signatureCaption}>
                  фамилия, имя,
                  <br />
                  отчество (при наличии)
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {editor?.kind === 'details' && (
        <RequestEditorModal
          title="Общие данные сводной заявки"
          fields={DETAIL_FIELDS}
          values={detailValues}
          onChange={updateFields}
          onClose={() => setEditor(null)}
        />
      )}

      {editor?.kind === 'row' && (
        <RequestEditorModal
          title={`Строка ${editor.index + 1} сводной заявки`}
          fields={ROW_FIELDS}
          values={draft.rows[editor.index] ?? emptyRow()}
          onChange={(changes) => updateRow(editor.index, changes)}
          onClose={() => setEditor(null)}
        />
      )}

      {editor?.kind === 'signatures' && (
        <RequestEditorModal
          title="Ответственные лица"
          fields={SIGNATURE_FIELDS}
          values={signatureValues}
          onChange={updateFields}
          onClose={() => setEditor(null)}
        />
      )}
    </main>
  );
};
