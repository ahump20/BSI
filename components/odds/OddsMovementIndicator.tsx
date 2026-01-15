/**
 * OddsMovementIndicator Component
 * Shows if odds are moving up, down, or stable
 */

import React from 'react';

export interface OddsMovementIndicatorProps {
  movement?: 'up' | 'down' | 'stable';
}

export function OddsMovementIndicator({ movement }: OddsMovementIndicatorProps) {
  if (!movement || movement === 'stable') {
    return null;
  }

  return (
    <span className={`text-xs ${movement === 'up' ? 'text-green-500' : 'text-red-500'}`}>
      {movement === 'up' ? '↑' : '↓'}
    </span>
  );
}
