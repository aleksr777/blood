import { useEffect, useState, type PropsWithChildren } from 'react';
import { initializeDatabase } from '../../storage/sqlite/database-client';
import { DatabaseError } from '../../storage/sqlite/database-errors';
import {
  databaseStartupMessages,
  type DatabaseStartupStage,
} from '../../storage/sqlite/database-startup';
import Modal from '../modal/modal';
import { useWorkingTabFocus } from './use-working-tab-focus';
import styles from './app-startup-gate.module.css';

type StartupState = {
  status: 'loading' | 'ready' | 'blocked' | 'error';
  retrying: boolean;
  message?: string;
};

const keepOpen = () => undefined;

export const AppStartupGate = ({ children }: PropsWithChildren) => {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<StartupState>({ status: 'loading', retrying: true });
  const [focusRequested, setFocusRequested] = useState(false);
  const [startupStage, setStartupStage] = useState<DatabaseStartupStage>('worker');
  const requestWorkingTabFocus = useWorkingTabFocus(state.status === 'ready');

  useEffect(() => {
    let active = true;
    void initializeDatabase((stage) => {
      if (active) setStartupStage(stage);
    }).then(
      () => {
        if (active) setState({ status: 'ready', retrying: false });
      },
      (error: unknown) => {
        if (!active) return;
        setState({
          status:
            error instanceof DatabaseError && error.code === 'database-in-use'
              ? 'blocked'
              : 'error',
          retrying: false,
          message:
            error instanceof Error ? error.message : 'Не удалось открыть локальную базу данных.',
        });
      },
    );
    return () => {
      active = false;
    };
  }, [attempt]);

  if (state.status === 'ready') return children;

  const blocked = state.status === 'blocked';
  const retry = () => {
    setState((previous) => ({ ...previous, retrying: true }));
    setAttempt((previous) => previous + 1);
  };

  return (
    <main className={styles.screen}>
      {state.status === 'loading' ? (
        <div className={styles.message} role="status">
          <p>Открываем приложение…</p>
          <p>{databaseStartupMessages[startupStage]}…</p>
        </div>
      ) : (
        <Modal
          title={blocked ? 'Приложение уже открыто' : 'Не удалось открыть приложение'}
          onClose={keepOpen}
          dismissible={false}
        >
          <div className={styles.message}>
            {blocked ? (
              <>
                <p>
                  Приложение уже открыто в другой вкладке. Одновременно работать с ним можно только
                  в одной вкладке.
                </p>
                <p>Перейдите в рабочую вкладку или закройте её, затем нажмите «Открыть здесь».</p>
              </>
            ) : (
              <p>{state.message}</p>
            )}
            <div className={styles.actions} aria-busy={state.retrying}>
              {blocked && (
                <button
                  type="button"
                  className="save-button"
                  onClick={() => {
                    requestWorkingTabFocus();
                    setFocusRequested(true);
                  }}
                >
                  Перейти в рабочую вкладку
                </button>
              )}
              <button
                type="button"
                className="secondary-button"
                disabled={state.retrying}
                onClick={retry}
              >
                {state.retrying ? 'Проверяем…' : blocked ? 'Открыть здесь' : 'Повторить'}
              </button>
            </div>
            {state.retrying && <p role="status">{databaseStartupMessages[startupStage]}…</p>}
            {blocked && focusRequested && (
              <p role="status">
                Если переключение не произошло, выберите рабочую вкладку приложения вручную.
              </p>
            )}
          </div>
        </Modal>
      )}
    </main>
  );
};
