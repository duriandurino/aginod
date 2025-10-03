'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { ReliefPin } from '@/lib/supabase-client';
import { format } from 'date-fns';

const CEBU_CENTER: [number, number] = [10.5, 123.9];

const createCustomIcon = (status: string, reliefType: string) => {
  const color = status === 'approved' ? '#22c55e' : status === 'pending' ? '#f59e0b' : '#ef4444';
  const reliefIcon = reliefType === 'food' ? '🍚' :
                     reliefType === 'medical' ? '⚕️' :
                     reliefType === 'shelter' ? '🏠' :
                     reliefType === 'water' ? '💧' :
                     reliefType === 'clothing' ? '👕' : '📦';

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 36px;
        height: 36px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <span style="transform: rotate(45deg); font-size: 18px;">${reliefIcon}</span>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
};

type MapClickHandlerProps = {
  onMapClick?: (lat: number, lng: number) => void;
};

function MapClickHandler({ onMapClick }: MapClickHandlerProps) {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

type ReliefMapProps = {
  pins: ReliefPin[];
  onPinClick?: (pin: ReliefPin) => void;
  onMapClick?: (lat: number, lng: number) => void;
  height?: string;
};

export default function ReliefMap({ pins, onPinClick, onMapClick, height = '600px' }: ReliefMapProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="w-full bg-gray-100 rounded-lg flex items-center justify-center" style={{ height }}>
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-lg overflow-hidden shadow-lg" style={{ height }}>
      <MapContainer
        center={CEBU_CENTER}
        zoom={10}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler onMapClick={onMapClick} />

        {pins.map((pin) => (
          <Marker
            key={pin.id}
            position={[pin.latitude, pin.longitude]}
            icon={createCustomIcon(pin.status, pin.relief_type)}
            eventHandlers={{
              click: () => onPinClick?.(pin),
            }}
          >
            <Popup>
              <div className="min-w-[200px]">
                <h3 className="font-bold text-lg mb-2">{pin.location_name}</h3>
                <div className="space-y-1 text-sm">
                  <p><strong>Type:</strong> {pin.relief_type}</p>
                  <p><strong>Status:</strong> <span className={`
                    ${pin.status === 'approved' ? 'text-green-600' : ''}
                    ${pin.status === 'pending' ? 'text-yellow-600' : ''}
                    ${pin.status === 'rejected' ? 'text-red-600' : ''}
                    font-semibold capitalize
                  `}>{pin.status}</span></p>
                  <p className="text-gray-600">{pin.description}</p>
                  {pin.photo_url && (
                    <img
                      src={pin.photo_url}
                      alt="Relief proof"
                      className="w-full h-32 object-cover rounded mt-2"
                    />
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {format(new Date(pin.created_at), 'PPp')}
                  </p>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
