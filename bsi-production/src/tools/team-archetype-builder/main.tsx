import React from 'react';
import { createRoot } from 'react-dom/client';
import BSITeamArchetypeBuilder from './TeamArchetypeBuilder';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <BSITeamArchetypeBuilder />
    </React.StrictMode>
  );
}
