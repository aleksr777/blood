import { FirstPage } from './first-page';
import { SecondPage } from './second-page';

export const TransfusionProtocol = () => {
  const printForm = () => window.print();

  return (
    <main className="app-shell">
      <div className="toolbar" aria-label="Панель действий">
        <div>
          <h1>Протокол трансфузии</h1>
          <p>Приложение № 11 к приказу Минздрава России от 28.10.2020 № 1170н</p>
        </div>
        <button type="button" className="print-button" onClick={printForm}>
          Печать A4
        </button>
      </div>

      <div className="print-hint">
        Заполните поля и нажмите «Печать A4». В окне печати браузера рекомендуется масштаб 100% и отключение колонтитулов браузера.
      </div>

      <div className="sheets">
        <FirstPage />
        <SecondPage />
      </div>
    </main>
  );
};
