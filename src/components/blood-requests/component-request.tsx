import { useEffect, useState } from 'react';
import { SiteNavigation } from '../site-navigation/site-navigation';
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

export const ComponentRequest = () => {
  const [draft, setDraft] = useState<Draft>(loadDraft);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [draft]);

  const updateField = (
    name: keyof Omit<Draft, 'rows' | 'careForm'>,
    value: string,
  ) => {
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
          <SiteNavigation current="component-request" showRecipient={false} />
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

          <table className={styles.topTable}>
            <tbody>
              <tr>
                <td>
                  Наименование и контактный телефон подразделения медицинской организации,
                  осуществляющего клиническое использование донорской крови и (или) ее компонентов
                </td>
                <td>
                  <input
                    className={styles.topTableInput}
                    value={draft.department}
                    onChange={(event) => updateField('department', event.target.value)}
                  />
                </td>
              </tr>
              <tr>
                <td>Дата и время подачи заявки</td>
                <td>
                  <input
                    type="datetime-local"
                    className={styles.topTableInput}
                    value={draft.requestDateTime}
                    onChange={(event) => updateField('requestDateTime', event.target.value)}
                  />
                </td>
              </tr>
              <tr>
                <td>Предполагаемые дата и время трансфузии</td>
                <td>
                  <input
                    type="datetime-local"
                    className={styles.topTableInput}
                    value={draft.plannedDateTime}
                    onChange={(event) => updateField('plannedDateTime', event.target.value)}
                  />
                </td>
              </tr>
              <tr>
                <td>Форма оказания медицинской помощи (нужное подчеркнуть)</td>
                <td>
                  <div className={styles.radioCell}>
                    <label>
                      <input
                        type="radio"
                        name="careForm"
                        checked={draft.careForm === 'urgent'}
                        onChange={() =>
                          setDraft((current) => ({ ...current, careForm: 'urgent' }))
                        }
                      />
                      <span>экстренная или неотложная</span>
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="careForm"
                        checked={draft.careForm === 'planned'}
                        onChange={() =>
                          setDraft((current) => ({ ...current, careForm: 'planned' }))
                        }
                      />
                      <span>плановая трансфузия</span>
                    </label>
                  </div>
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
                <tr key={index} className={styles.dataRow}>
                  {(
                    [
                      'recipientIdentity',
                      'medicalRecordNumber',
                      'recipientAbo',
                      'recipientRh',
                      'recipientAntigens',
                      'componentCode',
                      'quantity',
                      'indicationCode',
                      'individualSelection',
                      'individualSelectionCode',
                      'donorAbo',
                      'donorRhAntigens',
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

          <div className={styles.doctorSignature}>
            <span>Врач, проводящий трансфузию,</span>
            <div>
              <input
                className={styles.doctorNameInput}
                value={draft.doctorName}
                onChange={(event) => updateField('doctorName', event.target.value)}
              />
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
    </main>
  );
};
