'use client';

import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { PortalHeatmapPoint } from '../../../../lib/portal';

interface PortalHeatmapMapProps {
  points: PortalHeatmapPoint[];
}

const DEFAULT_CENTER: [number, number] = [34.6, -87.5];

export default function PortalHeatmapMap({ points }: PortalHeatmapMapProps) {
  const maxVolume = points.reduce((max, point) => Math.max(max, point.volume), 0) || 1;

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={5}
      scrollWheelZoom
      className="portal-heatmap__map"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {points.map((point) => {
        const radius = 8 + (point.volume / maxVolume) * 16;
        return (
          <CircleMarker
            key={point.id}
            center={[point.lat, point.lon]}
            radius={radius}
            pathOptions={{
              color: '#fbbf24',
              fillColor: '#fbbf24',
              fillOpacity: 0.45,
              weight: 1.2
            }}
          >
            <Tooltip direction="top" offset={[0, -4]} opacity={0.92} className="portal-heatmap__tooltip">
              <div className="portal-heatmap__tooltip-inner">
                <strong>{point.label}</strong>
                <div>{point.conference}</div>
                <div>{point.volume} movement events</div>
                <div>{point.nilTier} NIL tier focus</div>
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
