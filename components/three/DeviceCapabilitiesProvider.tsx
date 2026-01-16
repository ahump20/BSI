'use client';

/**
 * BSI Device Capabilities Provider
 *
 * React context for device performance tier detection.
 * Provides capability info to all 3D components.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  detectDeviceCapabilities,
  getInitialCapabilities,
  type DeviceCapabilities,
} from '@/lib/performance/device-tier';

const DeviceCapabilitiesContext = createContext<DeviceCapabilities | null>(null);

interface DeviceCapabilitiesProviderProps {
  children: ReactNode;
}

export function DeviceCapabilitiesProvider({ children }: DeviceCapabilitiesProviderProps) {
  const [capabilities, setCapabilities] = useState<DeviceCapabilities>(getInitialCapabilities);

  useEffect(() => {
    // Run async detection after mount
    detectDeviceCapabilities().then(setCapabilities);
  }, []);

  return (
    <DeviceCapabilitiesContext.Provider value={capabilities}>
      {children}
    </DeviceCapabilitiesContext.Provider>
  );
}

export function useDeviceCapabilities(): DeviceCapabilities {
  const context = useContext(DeviceCapabilitiesContext);

  if (!context) {
    // Return conservative defaults if used outside provider
    return getInitialCapabilities();
  }

  return context;
}
