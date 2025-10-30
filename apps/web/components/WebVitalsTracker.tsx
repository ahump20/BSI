'use client';

import { useWebVitals } from '../lib/performance/useWebVitals';

/**
 * Web Vitals Tracker Component
 *
 * Drop this component into your layout to automatically track Core Web Vitals.
 * Metrics are stored locally and sent to analytics endpoint.
 *
 * Usage:
 * ```tsx
 * import { WebVitalsTracker } from './components/WebVitalsTracker';
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <WebVitalsTracker />
 *         {children}
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function WebVitalsTracker() {
  useWebVitals();
  return null;
}
