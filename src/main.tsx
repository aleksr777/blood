import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import './styles/controls.css';
import './styles/ui.css';
import './index.css';
import App from './app.tsx';
import { AppStartupGate } from './components/app-startup/app-startup-gate';
import { WorkspaceSessionGate } from './components/workspace-session/workspace-session-gate';
import { resolveTextSelectionMode } from './domain/text-selection';

document.documentElement.dataset.textSelection = resolveTextSelectionMode(
  import.meta.env.DEV,
  import.meta.env.VITE_ENABLE_TEXT_SELECTION,
);

document.addEventListener('dragstart', (event) => {
  event.preventDefault();
});

const rootElement = document.getElementById('root');

createRoot(rootElement!).render(
  <StrictMode>
    <AppStartupGate>
      <WorkspaceSessionGate>
        <App />
      </WorkspaceSessionGate>
    </AppStartupGate>
  </StrictMode>,
);

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, {
        scope: import.meta.env.BASE_URL,
        updateViaCache: 'none',
      })
      .catch((error: unknown) => console.warn('Не удалось включить работу без сети.', error));
  });
}
