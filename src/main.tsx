import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

(window as any).global = window;
(window as any).process = { env: {} };
(window as any).Buffer = (window as any).Buffer || [];

createRoot(document.getElementById('root')!).render(
    <App />
)