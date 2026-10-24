import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import './styles/controls.css';
import './styles/ui.css';
import './index.css';
import App from './app.tsx';
import { AppStartupGate } from './components/app-startup/app-startup-gate';
import { WorkspaceSessionGate } from './components/workspace-session/workspace-session-gate';

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
