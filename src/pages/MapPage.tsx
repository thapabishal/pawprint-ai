import 'leaflet/dist/leaflet.css';
import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { DogCurrentStatusView, EventType } from '@/types';
import { Navigation, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

// Fix Leaflet default icon bug
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const STATUS_COLORS: Record<string, string> = {
  caught: '#F59E0B',
  vaccinate: '#F59E0B',
  sterilize: '#F59E0B',
  recover: '#F59E0B',
  release: '#10B981',
  observation: '#8B5CF6',
  critical: '#EF4444',
};

const createCustomIcon = (status: EventType, condition: string) => {
  const isCritical = condition === 'critical';
  const color = isCritical ? STATUS_COLORS.critical : (STATUS_COLORS[status] || '#9CA3AF');

  return L.divIcon({
    className: '',
    html: `
      <div class="relative flex items-center justify-center w-[28px] h-[28px] rounded-full border-[3px] bg-white shadow-md ${isCritical ? 'pulse-critical' : ''}" style="border-color: ${color}">
        <div class="w-[16px] h-[16px] rounded-full bg-white"></div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

const LocateMeControl = ({ setUserPos }: { setUserPos: (pos: L.LatLng, acc: number) => void }) => {
  const map = useMap();

  const handleLocate = () => {
    map.locate({ setView: false }).on('locationfound', (e) => {
      map.flyTo(e.latlng, 18);
      setUserPos(e.latlng, e.accuracy);
    });
  };

  return (
    <button
      onClick={handleLocate}
      className="absolute bottom-[24px] right-[16px] z-[1000] flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg border border-gray-100 active:scale-95 transition-transform"
      aria-label="Locate Me"
    >
      <Navigation size={20} className="text-primary fill-primary/10" />
    </button>
  );
};

const MapPage: React.FC = () => {
  const [filter, setFilter] = useState<'all' | EventType>('all');
  const [userPos, setUserPos] = useState<L.LatLng | null>(null);
  const [userAccuracy, setUserAccuracy] = useState<number>(0);

  const { data: dogs } = useQuery({
    queryKey: ['dog_markers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dog_current_status')
        .select('dog_id,current_status,last_event_location,cover_image_url,sex,age_group,condition');
      if (error) throw error;
      return data as DogCurrentStatusView[];
    },
    refetchInterval: 30000,
  });

  const parseLocation = (loc: unknown): [number, number] | null => {
    if (!loc) return null;
    if (typeof loc === 'string') {
      const match = loc.match(/POINT\(([^ ]+) ([^ ]+)\)/);
      if (match) return [parseFloat(match[2]), parseFloat(match[1])];
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const l = loc as any;
    if (l.coordinates) {
      return [l.coordinates[1], l.coordinates[0]];
    }
    return null;
  };

  const filteredDogs = useMemo(() => {
    return dogs?.filter(dog => {
      if (filter === 'all') return true;
      return dog.current_status === filter;
    });
  }, [dogs, filter]);

  const statuses: { label: string, value: 'all' | EventType }[] = [
    { label: 'All Dogs', value: 'all' },
    { label: 'In Clinic', value: 'catch' },
    { label: 'Released', value: 'release' },
    { label: 'Observation', value: 'observation' },
  ];

  return (
    <div className="relative w-full overflow-hidden" style={{ height: 'calc(100dvh - 68px)' }}>
      <div className="absolute top-4 left-4 right-4 z-[1000] flex items-center gap-2 overflow-x-auto no-scrollbar rounded-[12px] bg-white/90 p-2 backdrop-blur-md shadow-lg border border-white/20">
        {statuses.map((s) => (
          <button
            key={s.value}
            onClick={() => setFilter(s.value)}
            className={`flex-none whitespace-nowrap rounded-full px-4 py-1.5 text-[13px] font-medium transition-all ${
              filter === s.value
                ? 'bg-primary text-white shadow-sm'
                : 'bg-white text-gray-700 border border-gray-200'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <MapContainer
        center={[27.7172, 85.3240]}
        zoom={14}
        zoomControl={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {filteredDogs?.map((dog) => {
          const pos = parseLocation(dog.last_event_location);
          if (!pos) return null;

          return (
            <Marker
              key={dog.dog_id}
              position={pos}
              icon={createCustomIcon(dog.current_status, dog.condition)}
            >
              <Popup>
                <div className="flex flex-col p-3 w-full">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 border border-gray-100">
                      {dog.cover_image_url ? (
                        <img src={dog.cover_image_url} alt="Dog" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <MapPin size={20} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs font-bold text-gray-900 truncate">
                        ID: {dog.dog_id.split('-')[0].toUpperCase()}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: dog.condition === 'critical' ? STATUS_COLORS.critical : (STATUS_COLORS[dog.current_status] || '#9CA3AF') }}
                        />
                        <span className="text-[10px] uppercase font-bold text-gray-500 tracking-tight">
                          {dog.current_status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Link
                    to={`/dog/${dog.dog_id}`}
                    className="text-[13px] font-bold text-primary flex items-center justify-end gap-1 hover:underline active:opacity-70 transition-opacity"
                  >
                    View Profile →
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {userPos && (
          <>
            <Marker
              position={userPos}
              icon={L.divIcon({
                className: '',
                html: '<div class="w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-md animate-pulse"></div>',
                iconSize: [16, 16],
                iconAnchor: [8, 8],
              })}
            />
            <Circle
              center={userPos}
              radius={userAccuracy}
              pathOptions={{ fillColor: '#3B82F6', fillOpacity: 0.15, color: '#3B82F6', weight: 1, dashArray: '4, 4' }}
            />
          </>
        )}

        <LocateMeControl setUserPos={(pos, acc) => {
          setUserPos(pos);
          setUserAccuracy(acc);
        }} />
      </MapContainer>
    </div>
  );
};

export default MapPage;
