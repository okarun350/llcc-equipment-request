import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import AdminPanel from './AdminPanel.tsx'

const isAdmin = window.location.pathname.endsWith('/admin') ||
  window.location.hash === '#admin'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isAdmin ? <AdminPanel /> : <App />}
  </StrictMode>,
)
