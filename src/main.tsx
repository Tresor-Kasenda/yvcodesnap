import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useThemeStore } from './store/themeStore'
import { setupServiceWorker } from './pwa/registerServiceWorker'

// Initialize theme before rendering
const themeStore = useThemeStore.getState();
themeStore.setTheme(themeStore.theme);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

setupServiceWorker();
