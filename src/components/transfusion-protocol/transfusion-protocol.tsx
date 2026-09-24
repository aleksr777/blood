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
      <div className="print-actions" aria-label="Панель печати">
        <button type="button" className="print-button" onClick={() => printPage('first')}>
          Печать страницы 1
        </button>
        <button type="button" className="print-button" onClick={() => printPage('second')}>
          Печать страницы 2
        </button>
      </div>

      <div className="sheets">
        <FirstPage />
        <SecondPage />
      </div>
    </main>
  );
};
