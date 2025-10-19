import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App';

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPublishableKey) {
  console.warn(
    'VITE_CLERK_PUBLISHABLE_KEY is not set. ClerkProvider will not initialize fully.'
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={clerkPublishableKey} appearance={{
      baseTheme: 'dark',
    }}
    >
      <App />
    </ClerkProvider>
  </React.StrictMode>
);
