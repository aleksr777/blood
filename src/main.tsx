import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './app.tsx';
import { AppStartupGate } from './components/app-startup/app-startup-gate';

const rootElement = document.getElementById('root');

createRoot(rootElement!).render(
  <StrictMode>
    <AppStartupGate>
      <App />
    </AppStartupGate>
  </StrictMode>,
);
