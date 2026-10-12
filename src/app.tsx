import { useEffect, useState } from 'react';
import CustomScrollbar from './components/scrollbar/custom-scrollbar';
import { TransfusionProtocol } from './components/transfusion-protocol/transfusion-protocol';
import { TransfusionRegistration } from './components/transfusion-registration/transfusion-registration';

type AppPage = 'protocol' | 'registration';

const getPage = (): AppPage =>
  window.location.hash === '#/registration' ? 'registration' : 'protocol';

const App = () => {
  const [page, setPage] = useState<AppPage>(getPage);

  useEffect(() => {
    const handleHashChange = () => setPage(getPage);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.appPage = page;
    return () => {
      delete document.documentElement.dataset.appPage;
    };
  }, [page]);

  return (
    <>
      {page === 'registration' ? <TransfusionRegistration /> : <TransfusionProtocol />}
      <CustomScrollbar />
    </>
  );
};

export default App;
