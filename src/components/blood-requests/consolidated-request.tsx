import { useEffect, useState } from 'react';
import { SiteNavigation } from '../site-navigation/site-navigation';
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

export const ConsolidatedRequest = () => {
  const [draft, setDraft] = useState<Draft>(loadDraft);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [draft]);

  const updateField = (name: keyof Omit<Draft, 'rows'>, value: string) => {
    setDraft((current) => ({ ...current, [name]: value }));
  };

  const updateRow = (index: number, field: keyof RequestRow, value: string) => {
    setDraft((current) => ({
      ...current,
      rows: current.rows.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row,
      ),
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

          <div className={styles.formLines}>
            <label className={styles.lineField}>
              <span className={styles.label}>
                Наименование и контактный телефон медицинской организации, осуществляющей
                клиническое использование донорской крови и (или) ее компонентов
              </span>
              <input
                className={styles.lineInput}
                value={draft.organization}
                onChange={(event) => updateField('organization', event.target.value)}
              />
            </label>

            <label className={styles.lineField}>
              <span className={styles.label}>
                Контактный телефон заведующего кабинетом трансфузиологии (отделением переливания
                крови (отделением трансфузиологии))
              </span>
              <input
                className={styles.lineInput}
                value={draft.transfusionHeadPhone}
                onChange={(event) => updateField('transfusionHeadPhone', event.target.value)}
              />
            </label>

            <label className={styles.lineField}>
              <span className={styles.label}>
                Наименование и контактный телефон медицинской организации, осуществляющей
                заготовку донорской крови и (или) ее компонентов
              </span>
              <input
                className={styles.lineInput}
                value={draft.supplier}
                onChange={(event) => updateField('supplier', event.target.value)}
              />
            </label>
          </div>

          <div className={styles.dateRow}>
            <label className={styles.dateField}>
              <span className={styles.label}>Дата подачи сводной заявки</span>
              <input
                type="date"
                className={`${styles.lineInput} ${styles.dateInput}`}
                value={draft.requestDate}
                onChange={(event) => updateField('requestDate', event.target.value)}
              />
            </label>
            <div className={styles.noteBox}>
              Для проведения индивидуального подбора компонентов крови
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
                <tr key={index} className={styles.dataRow}>
                  <td>{index + 1}</td>
                  {(
                    [
                      'donorAbo',
                      'donorRh',
                      'donorAntigens',
                      'componentName',
                      'quantity',
                      'individualSelection',
                      'recipientIdentity',
                      'recipientAbo',
                      'recipientRh',
                      'recipientAntigens',
                      'selectionIndications',
                    ] as const
                  ).map((field) => (
                    <td key={field}>
                      <textarea
                        className={styles.cellTextarea}
                        value={row[field]}
                        onChange={(event) => updateRow(index, field, event.target.value)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <div className={styles.signatureArea}>
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
                <input
                  className={styles.signatureNameInput}
                  value={draft.transfusionHeadName}
                  onChange={(event) => updateField('transfusionHeadName', event.target.value)}
                />
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
                <input
                  className={styles.signatureNameInput}
                  value={draft.organizationHeadName}
                  onChange={(event) => updateField('organizationHeadName', event.target.value)}
                />
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
    </main>
  );
};
