import { FirstPage } from './first-page';
import { SecondPage } from './second-page';

type PrintPage = 'first' | 'second';

export const TransfusionProtocol = () => {
  const printPage = (page: PrintPage) => {
    const root = document.documentElement;

    const cleanup = () => {
      delete root.dataset.printPage;
      window.removeEventListener('afterprint', cleanup);
    };

    root.dataset.printPage = page;
    window.addEventListener('afterprint', cleanup);
    window.print();
  };

  return (
    <main className="app-shell">
      <div className="toolbar" aria-label="Панель действий">
        <div>
          <h1>Протокол трансфузии</h1>
          <p>Приложение № 11 к приказу Минздрава России от 28.10.2020 № 1170н</p>
        </div>
        <div className="print-actions">
          <button type="button" className="print-button" onClick={() => printPage('first')}>
            Печать страницы 1
          </button>
          <button type="button" className="print-button" onClick={() => printPage('second')}>
            Печать страницы 2
          </button>
        </div>
      </div>

      <div className="print-hint">
        Заполните поля и выберите страницу для печати. В окне печати браузера рекомендуется масштаб
        100% и отключение колонтитулов браузера.
      </div>

      <div className="sheets">
        <FirstPage />
        <SecondPage />
      </div>
    </main>
  );
};
