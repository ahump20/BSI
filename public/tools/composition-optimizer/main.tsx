import React from 'react';
import { createRoot } from 'react-dom/client';
import MonteCarloOptimizer from './MonteCarloOptimizer';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <MonteCarloOptimizer />
    </React.StrictMode>
  );
}
