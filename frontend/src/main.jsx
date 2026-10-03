import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { iniciarSincronizacao } from './services/pontoOffline.js'

// Envia os pontos que ficaram guardados no aparelho (offline) assim que der.
iniciarSincronizacao()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
