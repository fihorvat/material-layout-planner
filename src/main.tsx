import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from '@/app/App';
import { initializeTheme } from '@/state';
import '@/app/theme.css';

initializeTheme();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
