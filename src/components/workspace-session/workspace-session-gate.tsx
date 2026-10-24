import { useEffect, useState, type PropsWithChildren } from 'react';
import { prepareWorkspaceSession } from '../../storage/repositories/workspace-session';
import ui from '../../styles/ui';
import Modal from '../modal/modal';
import styles from '../app-startup/app-startup-gate.module.css';
import { watchWorkspaceActivity } from './watch-workspace-activity';

type State = { status: 'checking' | 'ready' | 'resetting' | 'error'; message?: string };
const keepOpen = () => undefined;

export const WorkspaceSessionGate = ({ children }: PropsWithChildren) => {
  const [state, setState] = useState<State>({ status: 'checking' });

  useEffect(() => {
    if (state.status !== 'checking' && state.status !== 'resetting') return;
    let active = true;
    // Forms are unmounted before clearing storage, so their effects cannot restore stale drafts.
    void prepareWorkspaceSession().then(
      () => active && setState({ status: 'ready' }),
      (error: unknown) => {
        if (active)
          setState({
            status: 'error',
            message: error instanceof Error ? error.message : 'Не удалось очистить рабочие бланки.',
          });
      },
    );
    return () => {
      active = false;
    };
  }, [state.status]);

  useEffect(() => {
    if (state.status === 'ready')
      return watchWorkspaceActivity(() => setState({ status: 'resetting' }));
  }, [state.status]);

  if (state.status === 'ready') return children;
  return (
    <main className={styles.screen}>
      {state.status === 'error' ? (
        <Modal title="Не удалось очистить рабочие бланки" onClose={keepOpen} dismissible={false}>
          <div className={styles.message}>
            <p>{state.message}</p>
            <div className={styles.actions}>
              <button
                type="button"
                className={ui.secondaryButton}
                onClick={() => setState({ status: 'checking' })}
              >
                Повторить
              </button>
            </div>
          </div>
        </Modal>
      ) : (
        <p role="status">
          {state.status === 'resetting' ? 'Очищаем рабочие бланки…' : 'Открываем рабочие бланки…'}
        </p>
      )}
    </main>
  );
};
