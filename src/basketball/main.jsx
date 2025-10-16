import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import BasketballApp from './BasketballApp.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BasketballApp />
  </StrictMode>,
)
