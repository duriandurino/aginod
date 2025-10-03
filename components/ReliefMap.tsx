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

// Helper function to convert UTC date to Philippines time and format it
const formatPhilippinesDate = (dateString: string) => {
  const date = new Date(dateString);
  
  // Use toLocaleString with Asia/Manila timezone
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };
  
  return date.toLocaleString('en-US', options).replace(',', ' •');
};

const createCustomIcon = (status: string, reliefType: string, isOwnPin: boolean = false) => {
  // Use purple color for user's own pins, otherwise use status-based colors
  const color = isOwnPin 
    ? '#9333ea' // Purple for own pins
    : status === 'approved' 
      ? '#22c55e' 
      : status === 'pending' 
        ? '#f59e0b' 
        : status === 'completed'
          ? '#6b7280'
          : '#ef4444';
  
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
        border: ${isOwnPin ? '3px solid #fbbf24' : '3px solid white'};
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
  currentUserId?: string;
};

export default function ReliefMap({ pins, onPinClick, onMapClick, height = '600px', currentUserId }: ReliefMapProps) {
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

        {pins.map((pin) => {
          const isOwnPin = currentUserId ? pin.user_id === currentUserId : false;
          
          return (
            <Marker
              key={pin.id}
              position={[pin.latitude, pin.longitude]}
              icon={createCustomIcon(pin.status, pin.relief_type, isOwnPin)}
              eventHandlers={{
                click: () => onPinClick?.(pin),
              }}
            >
            <Popup maxWidth={320} className="custom-popup">
              <div className="min-w-[280px] max-w-[320px]">
                {/* Header with location and relief type */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900 leading-tight">{pin.location_name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-2xl">
                        {pin.relief_type === 'food' ? '🍚' :
                         pin.relief_type === 'medical' ? '⚕️' :
                         pin.relief_type === 'shelter' ? '🏠' :
                         pin.relief_type === 'water' ? '💧' :
                         pin.relief_type === 'clothing' ? '👕' : '📦'}
                      </span>
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {pin.relief_type} Relief
                      </span>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    pin.status === 'approved' ? 'bg-green-100 text-green-800' :
                    pin.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    pin.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {pin.status}
                  </div>
                </div>

                {/* Description */}
                <div className="mb-3">
                  <p className="text-sm text-gray-700 leading-relaxed">{pin.description}</p>
                </div>

                {/* Photo */}
                {pin.photo_url && (
                  <div className="mb-3">
                    <img
                      src={pin.photo_url}
                      alt="Relief distribution photo"
                      className="w-full h-40 object-cover rounded-lg shadow-sm border border-gray-200"
                    />
                  </div>
                )}

                {/* Date and time information */}
                <div className="space-y-2 text-xs text-gray-500 border-t border-gray-100 pt-3">
                  <div className="flex justify-between">
                    <span className="font-medium">Posted:</span>
                    <span>{formatPhilippinesDate(pin.created_at)}</span>
                  </div>
                  
                  {/* Show datetime info if available */}
                  {pin.start_datetime && (
                    <div className="flex justify-between">
                      <span className="font-medium">Starts:</span>
                      <span>{formatPhilippinesDate(pin.start_datetime)}</span>
                    </div>
                  )}
                  
                  {pin.end_datetime && (
                    <div className="flex justify-between">
                      <span className="font-medium">Ends:</span>
                      <span className={new Date(pin.end_datetime) < new Date() ? 'text-red-600 font-medium' : ''}>
                        {formatPhilippinesDate(pin.end_datetime)}
                        {new Date(pin.end_datetime) < new Date() && ' (Expired)'}
                      </span>
                    </div>
                  )}
                </div>

                {/* User info */}
                {pin.user_profile && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                    {pin.user_profile.avatar_url ? (
                      <img
                        src={pin.user_profile.avatar_url}
                        alt="User avatar"
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600">
                          {pin.user_profile.full_name?.[0] || pin.user_profile.email?.[0] || '?'}
                        </span>
                      </div>
                    )}
                    <span className="text-xs text-gray-600">
                      by {pin.user_profile.full_name || pin.user_profile.email}
                    </span>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
