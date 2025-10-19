import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import BasketballApp from './BasketballApp'
import '../index.css'
import { initSentry } from '../monitoring/sentry'
import { trackCoreWebVitals } from '../monitoring/webVitals'

initSentry()
trackCoreWebVitals()

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element #root not found in document')
}

createRoot(rootElement).render(
  <StrictMode>
    <BasketballApp />
  </StrictMode>
)
