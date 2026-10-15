import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import App from './App.tsx'
import Aiguillage from './projet/Aiguillage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Aiguillage>
      <App />
    </Aiguillage>
  </StrictMode>,
)
