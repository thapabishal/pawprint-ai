import 'leaflet/dist/leaflet.css';
import React, { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { DogCurrentStatusView, ProgrammeType } from '@/types';
import { Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, isBefore } from 'date-fns';

// Fix Leaflet default icon bug
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const STATUS_COLORS: Record<string, string> = {
  cnvr: '#0D7377',
  vaccination: '#F0A500',
  released: '#10B981',
  observation: '#8B5CF6',
  critical: '#EF4444',
  default: '#9CA3AF'
};

const PROGRAMME_COLORS: Record<ProgrammeType, string> = {
  cnvr: '#0D7377',
  vaccination: '#F0A500',
};

const createCustomIcon = (dog: DogCurrentStatusView) => {
  const isCritical = dog.condition === 'critical';
  const isReleased = dog.current_status === 'release';
  const isObservation = dog.current_status === 'observation';

  const color = isCritical
    ? STATUS_COLORS.critical
    : isObservation
      ? STATUS_COLORS.observation
      : isReleased
        ? STATUS_COLORS.released
        : STATUS_COLORS[dog.programme_type as keyof typeof STATUS_COLORS] || STATUS_COLORS.default;

  const progColor = PROGRAMME_COLORS[dog.programme_type] || '#9CA3AF';

  return L.divIcon({
    className: '',
    html: `
      <div class="relative flex items-center justify-center w-[32px] h-[32px] rounded-full shadow-md ${isCritical ? 'pulse-critical' : ''}" style="background-color: ${color}">
        <div class="w-[14px] h-[14px] rounded-full bg-white"></div>
        <div class="absolute bottom-0 right-0 w-[8px] h-[8px] rounded-full border border-white" style="background-color: ${progColor}"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
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
      <Navigation size={20} className="text-[#0D7377] fill-[#0D7377]/10" />
    </button>
  );
};

type MapFilter = 'all' | 'cnvr' | 'vaccination' | 'released' | 'critical';

const MapPage: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<MapFilter>('all');
  const [userPos, setUserPos] = useState<L.LatLng | null>(null);
  const [userAccuracy, setUserAccuracy] = useState<number>(0);

  const { data: dogs } = useQuery({
    queryKey: ['dog_markers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dog_current_status')
        .select('dog_id, current_status, programme_type, last_event_location, catch_location, cover_image_url, sex, age_group, condition, vaccination_status, vaccination_date, next_vaccination_due, catch_timestamp, catch_notes, sterilization_status');
      if (error) throw error;
      return data as (DogCurrentStatusView & { sterilization_status: string })[];
    },
    refetchInterval: 30000,
  });

  useEffect(() => {
    const handlePopupClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const btn = target.closest('.view-profile-btn') as HTMLElement;
      if (btn && btn.dataset.dogId) {
        navigate(`/dogs/${btn.dataset.dogId}`);
      }
    };

    document.addEventListener('click', handlePopupClick);
    return () => document.removeEventListener('click', handlePopupClick);
  }, [navigate]);

  const parseLocation = (loc: unknown): [number, number] | null => {
    if (!loc) return null;
    if (typeof loc === "string") {
      const match = loc.match(/POINT\\(([^ ]+) ([^ ]+)\\)/);
      if (match) return [parseFloat(match[2]), parseFloat(match[1])];
    }

    interface PostGISPoint {
      coordinates: [number, number];
    }

    const l = loc as PostGISPoint;
    if (l && Array.isArray(l.coordinates) && l.coordinates.length === 2) {
      return [l.coordinates[1], l.coordinates[0]];
    }
    return null;
  };

  const filteredDogs = useMemo(() => {
    if (!dogs) return [];
    return dogs.filter(dog => {
      if (filter === 'all') return true;
      if (filter === 'cnvr') return dog.programme_type === 'cnvr';
      if (filter === 'vaccination') return dog.programme_type === 'vaccination';
      if (filter === 'released') return dog.current_status === 'release';
      if (filter === 'critical') return dog.condition === 'critical';
      return true;
    });
  }, [dogs, filter]);

  const counts = useMemo(() => {
    if (!dogs) return { all: 0, cnvr: 0, vaccination: 0, released: 0, critical: 0 };
    return {
      all: dogs.length,
      cnvr: dogs.filter(d => d.programme_type === 'cnvr').length,
      vaccination: dogs.filter(d => d.programme_type === 'vaccination').length,
      released: dogs.filter(d => d.current_status === 'release').length,
      critical: dogs.filter(d => d.condition === 'critical').length,
    };
  }, [dogs]);

  const getPopupContent = (dog: DogCurrentStatusView & { sterilization_status: string }) => {
    const isCNVR = dog.programme_type === 'cnvr';
    const accentColor = isCNVR ? '#0D7377' : '#F0A500';
    const badgeLabel = isCNVR ? '🔬 CNVR' : '💉 Vaccination';
    const shortId = dog.dog_id.split('-')[0].toUpperCase();

    const daysSinceCatch = dog.catch_timestamp
      ? formatDistanceToNow(new Date(dog.catch_timestamp), { addSuffix: true })
      : 'Unknown date';

    const isBoosterOverdue = dog.next_vaccination_due
      ? isBefore(new Date(dog.next_vaccination_due), new Date())
      : false;

    const boosterColor = isBoosterOverdue ? '#EF4444' : '#6B7280';

    const sexIcon = dog.sex === 'male' ? '♂️' : dog.sex === 'female' ? '♀️' : '❓';
    const ageIcon = dog.age_group === 'puppy' ? '🐾' : dog.age_group === 'adult' ? '🐕' : '👴';
    const conditionDotColor = dog.condition === 'healthy' ? '#10B981' : dog.condition === 'injured' ? '#F59E0B' : dog.condition === 'critical' ? '#EF4444' : '#9CA3AF';

    return `
      <div class="flex flex-col w-full bg-white overflow-hidden text-left">
        {/* Photo Section */}
        <div class="relative w-full h-[110px]">
          ${dog.cover_image_url
            ? `<img src="${dog.cover_image_url}" class="w-full h-full object-cover" />`
            : `<div class="w-full h-full flex items-center justify-center" style="background: linear-gradient(135deg, ${accentColor}22 0%, ${accentColor}44 100%)">
                 <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${accentColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 5.172a2 2 0 0 0-1.414.586l-1.172 1.172A2 2 0 0 1 6.172 7.5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-10a2 2 0 0 0-2-2h-2.172a2 2 0 0 1-1.414-.586l-1.172-1.172A2 2 0 0 0 13.828 5.172z"/><circle cx="12" cy="13" r="3"/></svg>
               </div>`
          }
          <div class="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[11px] font-bold text-white shadow-sm" style="background-color: ${accentColor}">
            ${badgeLabel}
          </div>
        </div>

        {/* Details Section */}
        <div class="p-3 flex flex-col gap-2">
          <div class="font-mono text-[12px] text-gray-500">ID: ${shortId}</div>

          <div class="flex items-center justify-between">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-white" style="background-color: ${STATUS_COLORS[dog.current_status] || '#9CA3AF'}">
              ${dog.current_status}
            </span>
            <span class="text-[11px] text-gray-400">${daysSinceCatch}</span>
          </div>

          <div class="flex items-center gap-3 py-1 border-y border-gray-50">
            <div class="flex items-center gap-1 text-[11px] text-gray-700">
              <span>${sexIcon}</span>
              <span class="capitalize">${dog.sex}</span>
            </div>
            <div class="flex items-center gap-1 text-[11px] text-gray-700">
              <span>${ageIcon}</span>
              <span class="capitalize">${dog.age_group}</span>
            </div>
            <div class="flex items-center gap-1 text-[11px] text-gray-700">
              <div class="w-2 h-2 rounded-full" style="background-color: ${conditionDotColor}"></div>
              <span class="capitalize">${dog.condition}</span>
            </div>
          </div>

          <div class="flex flex-col gap-0.5">
            ${isCNVR
              ? `
                <div class="text-[11px] text-gray-400">📍 Caught: ${daysSinceCatch}</div>
                ${dog.sterilization_status === 'sterilized' ? `<div class="text-[11px] text-[#065F46] font-medium">✂️ Neutered</div>` : ''}
              `
              : `
                <div class="text-[11px] text-[#92400E]">💉 Vaccination recorded</div>
                <div class="text-[11px] font-medium" style="color: ${boosterColor}">
                  🔄 Booster due: ${dog.next_vaccination_due ? new Date(dog.next_vaccination_due).toLocaleDateString() : 'TBD'}
                </div>
              `
            }
          </div>

          ${dog.catch_notes
            ? `<div class="text-[11px] italic text-gray-400 truncate mt-1">"${dog.catch_notes}"</div>`
            : ''
          }
        </div>

        {/* Bottom Button */}
        <button data-dog-id="${dog.dog_id}" class="view-profile-btn w-full h-9 border-t border-gray-100 bg-[#F9FAFB] hover:bg-[#E6F7F6] text-[#0D7377] text-[13px] font-medium transition-colors flex items-center justify-center gap-1">
          View Full Profile →
        </button>
      </div>
    `;
  };

  return (
    <div className="relative w-full overflow-hidden" style={{ height: 'calc(100dvh - 68px)' }}>
      {/* Filter Bar */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex items-center gap-2 overflow-x-auto no-scrollbar rounded-[16px] bg-white/80 p-2 backdrop-blur-md shadow-lg border border-white/40">
        {[
          { id: 'all', label: 'All', count: counts.all, color: '#374151' },
          { id: 'cnvr', label: 'CNVR', count: counts.cnvr, color: '#0D7377' },
          { id: 'vaccination', label: 'Vaccination', count: counts.vaccination, color: '#F0A500' },
          { id: 'released', label: 'Released', count: counts.released, color: '#10B981' },
          { id: 'critical', label: 'Critical', count: counts.critical, color: '#EF4444' }
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => setFilter(btn.id as MapFilter)}
            className={cn(
              "flex items-center gap-1.5 flex-none whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-semibold transition-all duration-200",
              filter === btn.id
                ? "text-white shadow-md scale-105"
                : "bg-white/50 text-gray-600 border border-gray-100 hover:bg-white"
            )}
            style={{
              backgroundColor: filter === btn.id ? btn.color : undefined,
              borderColor: filter === btn.id ? btn.color : undefined
            }}
          >
            {btn.label}
            <span className={cn(
              "text-[11px] px-1.5 py-0.5 rounded-full",
              filter === btn.id ? "bg-white/20" : "bg-gray-100"
            )}>
              {btn.count}
            </span>
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="absolute bottom-[88px] left-[16px] z-[1000] w-[110px] bg-white/90 backdrop-blur-sm p-2.5 rounded-xl shadow-md border border-white/50 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#0D7377]"></div>
          <span className="text-[12px] font-medium text-gray-700">CNVR</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#F0A500]"></div>
          <span className="text-[12px] font-medium text-gray-700">Vaccination</span>
        </div>
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

        {filteredDogs.map((dog) => {
          const pos = parseLocation(dog.last_event_location);
          if (!pos) return null;

          return (
            <Marker
              key={dog.dog_id}
              position={pos}
              icon={createCustomIcon(dog)}
            >
              <Popup className="pawprint-popup">
                <div dangerouslySetInnerHTML={{ __html: getPopupContent(dog) }} />
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
