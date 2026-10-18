import { useEffect, useRef, useState } from 'react';
import { ComponentRequest } from './components/blood-requests/component-request';
import { IndividualSelectionDirection } from './components/blood-requests/individual-selection-direction';
import CustomScrollbar from './components/scrollbar/custom-scrollbar';
import { TransfusionProtocol } from './components/transfusion-protocol/transfusion-protocol';
import { TransfusionRegistration } from './components/transfusion-registration/transfusion-registration';

type AppPage = 'protocol' | 'registration' | 'summary-request' | 'component-request';
type TransitionPhase = 'idle' | 'leaving' | 'entering';

const TRANSITION_DURATION_MS = 160;

const getPage = (): AppPage => {
  switch (window.location.hash) {
    case '#/registration':
      return 'registration';
    case '#/summary-request':
      return 'summary-request';
    case '#/component-request':
      return 'component-request';
    default:
      return 'protocol';
  }
};

const App = () => {
  const [page, setPage] = useState<AppPage>(getPage);
  const [transitionPhase, setTransitionPhase] = useState<TransitionPhase>('idle');
  const transitionTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const clearTransitionTimer = () => {
      if (transitionTimerRef.current !== null) {
        window.clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
      }
    };

    const handleHashChange = () => {
      const nextPage = getPage();
      if (nextPage === page) return;

      clearTransitionTimer();
      setTransitionPhase('leaving');

      transitionTimerRef.current = window.setTimeout(() => {
        setPage(nextPage);
        setTransitionPhase('entering');

        requestAnimationFrame(() => {
          requestAnimationFrame(() => setTransitionPhase('idle'));
        });
      }, TRANSITION_DURATION_MS);
    };

    window.addEventListener('hashchange', handleHashChange);

    return () => {
      clearTransitionTimer();
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [page]);

  useEffect(() => {
    document.documentElement.dataset.appPage = page;
    return () => {
      delete document.documentElement.dataset.appPage;
    };
  }, [page]);

  return (
    <>
      <div
        className="app-page-transition"
        data-transition-phase={transitionPhase}
        aria-live="polite"
      >
        {page === 'registration' ? (
          <TransfusionRegistration />
        ) : page === 'summary-request' ? (
          <IndividualSelectionDirection />
        ) : page === 'component-request' ? (
          <ComponentRequest />
        ) : (
          <TransfusionProtocol />
        )}
      </div>
      <CustomScrollbar />
    </>
  );
};

export default App;
