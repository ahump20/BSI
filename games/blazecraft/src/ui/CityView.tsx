/**
 * CityView - Main city visualization component
 *
 * Renders the isometric floating island city and connects to
 * live events for real-time building upgrades.
 *
 * Features:
 * - Isometric Warcraft-style city
 * - 6 districts that upgrade with file completions
 * - Real-time updates via LiveBridge
 * - Demo mode fallback
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CityWorldRenderer, createCityWorldRenderer } from '@core/CityWorldRenderer';
import { LiveBridge, createLiveBridge, ConnectionStatus, EventPayload } from '@core/LiveBridge';
import type { CityState, BuildingKind } from '@core/BuildingSystem';
import { createInitialCityState, BUILDING_CONFIGS } from '@core/BuildingSystem';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface CityViewProps {
  onDistrictSelect?: (district: BuildingKind | null) => void;
  onEventReceived?: (event: EventPayload) => void;
  onStatusChange?: (status: ConnectionStatus) => void;
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = {
  container: {
    position: 'relative' as const,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    background: '#0D0D0D',
  },
  canvas: {
    width: '100%',
    height: '100%',
  },
  statusBadge: {
    position: 'absolute' as const,
    top: '0.5rem',
    left: '0.5rem',
    padding: '0.25rem 0.5rem',
    background: 'rgba(0, 0, 0, 0.7)',
    borderRadius: '4px',
    fontSize: '0.65rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
  },
  statusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
  },
  districtInfo: {
    position: 'absolute' as const,
    bottom: '0.5rem',
    left: '0.5rem',
    padding: '0.5rem 0.75rem',
    background: 'rgba(0, 0, 0, 0.8)',
    borderRadius: '4px',
    border: '1px solid #333',
    maxWidth: '200px',
  },
  districtName: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#F5F5DC',
    marginBottom: '0.25rem',
  },
  districtDesc: {
    fontSize: '0.7rem',
    color: '#888',
    marginBottom: '0.35rem',
  },
  districtStats: {
    fontSize: '0.65rem',
    color: '#666',
    display: 'flex',
    gap: '0.75rem',
  },
  upgradeNotification: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    padding: '1rem 2rem',
    background: 'rgba(191, 87, 0, 0.95)',
    borderRadius: '8px',
    textAlign: 'center' as const,
    animation: 'fadeInOut 2s ease-in-out',
  },
  upgradeTitle: {
    fontSize: '1.2rem',
    fontWeight: 700,
    color: '#FFF',
    marginBottom: '0.25rem',
  },
  upgradeSubtitle: {
    fontSize: '0.8rem',
    color: 'rgba(255, 255, 255, 0.8)',
  },
};

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export function CityView({
  onDistrictSelect,
  onEventReceived,
  onStatusChange,
}: CityViewProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<CityWorldRenderer | null>(null);
  const bridgeRef = useRef<LiveBridge | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [cityState, setCityState] = useState<CityState>(createInitialCityState);
  const [selectedDistrict, setSelectedDistrict] = useState<BuildingKind | null>(null);
  const [upgradeNotification, setUpgradeNotification] = useState<{
    building: string;
    tier: string;
  } | null>(null);

  // ─────────────────────────────────────────────────────────────
  // Initialization
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!containerRef.current) return;

    let mounted = true;

    async function init() {
      if (!containerRef.current || !mounted) return;

      try {
        // Create renderer
        const renderer = await createCityWorldRenderer({
          container: containerRef.current,
          onDistrictClick: (district) => {
            setSelectedDistrict(district);
            onDistrictSelect?.(district);
          },
          onDistrictHover: (district) => {
            // Could show tooltip
          },
          onReady: () => {
            if (mounted) setIsReady(true);
          },
        });
        rendererRef.current = renderer;

        // Create live bridge
        const bridge = createLiveBridge({
          onEvent: (event) => {
            onEventReceived?.(event);
          },
          onCityStateUpdate: (state) => {
            if (!mounted) return;
            setCityState(state);
            rendererRef.current?.updateCityState(state);
          },
          onBuildingUpgrade: (buildingKind) => {
            if (!mounted) return;
            const config = BUILDING_CONFIGS[buildingKind as BuildingKind];
            const state = bridgeRef.current?.getCityState();
            const tier = state?.buildings[buildingKind as BuildingKind]?.tier ?? 0;
            setUpgradeNotification({
              building: config.name,
              tier: config.tierNames[tier],
            });
            setTimeout(() => {
              if (mounted) setUpgradeNotification(null);
            }, 2000);
          },
          onStatusChange: (newStatus) => {
            if (!mounted) return;
            setStatus(newStatus);
            onStatusChange?.(newStatus);
          },
        });
        bridgeRef.current = bridge;

        // Try to connect (will fall back to demo mode)
        bridge.connect();

      } catch (error) {
        console.error('[CityView] Initialization failed:', error);
      }
    }

    init();

    return () => {
      mounted = false;
      rendererRef.current?.dispose();
      bridgeRef.current?.disconnect();
    };
  }, [onDistrictSelect, onEventReceived, onStatusChange]);

  // ─────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────

  const handleToggleDemo = useCallback(() => {
    if (!bridgeRef.current) return;
    bridgeRef.current.setDemoMode(!bridgeRef.current.isDemoMode());
  }, []);

  // ─────────────────────────────────────────────────────────────
  // Render Helpers
  // ─────────────────────────────────────────────────────────────

  const getStatusColor = (s: ConnectionStatus): string => {
    switch (s) {
      case 'live': return '#2ECC71';
      case 'demo': return '#F39C12';
      case 'connecting': return '#3498DB';
      default: return '#E74C3C';
    }
  };

  const getSelectedDistrictInfo = () => {
    if (!selectedDistrict) return null;
    const config = BUILDING_CONFIGS[selectedDistrict];
    const state = cityState.buildings[selectedDistrict];
    return { config, state };
  };

  const districtInfo = getSelectedDistrictInfo();

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────

  return (
    <div style={styles.container}>
      <div ref={containerRef} style={styles.canvas} />

      {/* Status Badge */}
      <div style={styles.statusBadge}>
        <div style={{ ...styles.statusDot, background: getStatusColor(status) }} />
        <span style={{ color: getStatusColor(status) }}>
          {status === 'demo' ? 'DEMO' : status.toUpperCase()}
        </span>
        {status === 'demo' && (
          <button
            onClick={handleToggleDemo}
            style={{
              marginLeft: '0.5rem',
              padding: '0.15rem 0.4rem',
              background: 'transparent',
              border: '1px solid #666',
              borderRadius: '3px',
              color: '#888',
              cursor: 'pointer',
              fontSize: '0.6rem',
            }}
          >
            TRY LIVE
          </button>
        )}
      </div>

      {/* Selected District Info */}
      {districtInfo && (
        <div style={styles.districtInfo}>
          <div style={{ ...styles.districtName, color: districtInfo.config.color }}>
            {districtInfo.config.name}
          </div>
          <div style={styles.districtDesc}>
            {districtInfo.config.description}
          </div>
          <div style={styles.districtStats}>
            <span>Tier: {districtInfo.config.tierNames[districtInfo.state.tier]}</span>
            <span>Tasks: {districtInfo.state.completions}</span>
          </div>
        </div>
      )}

      {/* Upgrade Notification */}
      {upgradeNotification && (
        <div style={styles.upgradeNotification}>
          <div style={styles.upgradeTitle}>
            {upgradeNotification.building} Upgraded!
          </div>
          <div style={styles.upgradeSubtitle}>
            Now: {upgradeNotification.tier}
          </div>
        </div>
      )}
    </div>
  );
}
