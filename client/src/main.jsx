import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { registerSW } from 'virtual:pwa-register';

// Register Service Worker immediately for offline capability and background Web Push notifications
if ('serviceWorker' in navigator) {
  registerSW({
    immediate: true,
    onRegisteredSW(swUrl, registration) {
      console.log('✅ Zenith Service Worker registered:', swUrl);
    },
    onRegisterError(error) {
      console.error('❌ Service Worker registration error:', error);
    }
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
