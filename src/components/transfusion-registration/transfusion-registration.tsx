import { SiteNavigation } from '../site-navigation/site-navigation';

const ROW_COUNT = 14;

export const TransfusionRegistration = () => {
  const print = () => window.print();

  return (
    <main className="registration-app-shell">
      <header className="app-header registration-header">
        <div className="toolbar-wrap registration-toolbar-wrap">
          <SiteNavigation current="registration" />
          <div className="registration-actions">
            <button type="button" className="print-button" onClick={print}>
              Печать
            </button>
          </div>
        </div>
      </header>

      <div className="registration-sheet-wrap">
        <section className="registration-sheet" aria-label="Лист регистрации трансфузии">
          <div className="registration-legal-reference">
            <a
              href="https://publication.pravo.gov.ru/document/0001202210190009"
              target="_blank"
              rel="noreferrer"
            >
              Приказ Минздрава России от 05.08.2022 № 530н
            </a>
          </div>

          <h1 className="registration-title">
            ЛИСТ РЕГИСТРАЦИИ ТРАНСФУЗИИ (ПЕРЕЛИВАНИЯ) ДОНОРСКОЙ КРОВИ И (ИЛИ) ЕЕ КОМПОНЕНТОВ
          </h1>

          <div className="registration-patient-details">
            <div className="registration-patient-line registration-patient-line--name">
              <span>Фамилия, имя, отчество (при наличии)</span>
              <span className="registration-blank registration-blank--name" />
            </div>

            <div className="registration-patient-line registration-patient-line--meta">
              <span>Дата рождения «</span>
              <span className="registration-blank registration-blank--day" />
              <span>»</span>
              <span className="registration-blank registration-blank--date" />
              <span className="registration-blank registration-blank--year" />
              <span>г. № медицинской карты</span>
              <span className="registration-blank registration-blank--card" />
              <span>№ палаты</span>
              <span className="registration-blank registration-blank--room" />
            </div>
          </div>

          <table className="registration-table">
            <colgroup>
              <col className="registration-col-component" />
              <col className="registration-col-liters" />
              <col className="registration-col-units" />
              <col className="registration-col-date" />
              <col className="registration-col-doctor" />
              <col className="registration-col-doctor-sign" />
              <col className="registration-col-worker" />
              <col className="registration-col-nurse-sign" />
              <col className="registration-col-complications" />
            </colgroup>
            <thead>
              <tr>
                <th rowSpan={2}>Наименование компонента крови</th>
                <th colSpan={2}>Количество</th>
                <th rowSpan={2}>Дата проведения трансфузии</th>
                <th rowSpan={2}>
                  Фамилия, имя, отчество (при наличии) лечащего врача (врача-специалиста),
                  проводившего трансфузию
                </th>
                <th rowSpan={2}>
                  Подпись лечащего врача (врача-специалиста), проводившего трансфузию
                </th>
                <th rowSpan={2}>
                  Фамилия, имя, отчество (при наличии) медицинского работника, ответственного за
                  выполнение трансфузии
                </th>
                <th rowSpan={2}>
                  Подпись медицинской сестры, ответственной за выполнение трансфузии
                </th>
                <th rowSpan={2}>Информация о наличии посттрансфузионных осложнений (да/нет)</th>
              </tr>
              <tr>
                <th>литр</th>
                <th>единицы</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: ROW_COUNT }, (_, index) => (
                <tr key={index}>
                  {Array.from({ length: 9 }, (_, cellIndex) => (
                    <td key={cellIndex}>&nbsp;</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
};
