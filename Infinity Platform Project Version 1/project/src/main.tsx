import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

try {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} catch (error) {
  console.error('Failed to render app:', error);
  rootElement.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; background: white;">
      <div style="max-width: 500px; text-align: center;">
        <h1 style="color: #dc2626; font-size: 24px; margin-bottom: 16px;">Application Error</h1>
        <p style="color: #374151; margin-bottom: 16px;">An error occurred while loading the application.</p>
        <p style="color: #6b7280; font-size: 14px;">Please check the browser console for details.</p>
        <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer;">
          Reload Page
        </button>
      </div>
    </div>
  `;
}
