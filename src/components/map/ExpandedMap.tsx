'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { Trip } from '@/types/itinerary';
import { useItineraryUI } from '@/contexts/ItineraryUIContext';
import TabbedDestinationRail from '@/components/itinerary/TabbedDestinationRail';
import CalendarStrip from '@/components/itinerary/CalendarStrip';
import TimelineView from '@/components/itinerary/TimelineView';
import { getDestinationColors, resolveColorHex } from '@/utils/colors';

interface ExpandedMapProps {
  trip: Trip;
  onUpdateTrip: (trip: Trip) => void;
  onRemoveDestination?: (destinationId: string) => void;
}

export default function ExpandedMap({ trip, onUpdateTrip, onRemoveDestination }: ExpandedMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [status, setStatus] = useState<'mount' | 'no-token' | 'init' | 'loaded'>('mount');
  const { setIsExpanded, selectedDay, setSelectedDay, selectedDestinationId, setSelectedDestinationId } = useItineraryUI();

  useEffect(() => {
    let cancelled = false;
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!token) {
      setStatus('no-token');
      return;
    }

    if (!containerRef.current || mapRef.current) return;
    mapboxgl.accessToken = token;
    setStatus('init');
    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-30, 30],
      zoom: 2.2,
      projection: 'mercator',
      attributionControl: false,
    });

    mapRef.current.on('load', () => {
      mapRef.current?.resize();
      try { mapRef.current?.setProjection('mercator'); } catch {}
      mapRef.current?.setPitch(0);
      mapRef.current?.setBearing(0);
      try { mapRef.current?.dragRotate?.disable(); } catch {}
      try { mapRef.current?.touchZoomRotate?.disableRotation(); } catch {}
      try { mapRef.current?.scrollZoom?.enable(); } catch {}
      setStatus('loaded');
      // Extra resize to ensure canvas picks up final layout
      requestAnimationFrame(() => mapRef.current?.resize());
    });

    // Keep map sized with window
    const onResize = () => mapRef.current?.resize();
    window.addEventListener('resize', onResize);

    return () => {
      cancelled = true;
      window.removeEventListener('resize', onResize);
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Markers/fitBounds
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== 'loaded') return;
    (map as any).__markers?.forEach((m: mapboxgl.Marker) => m.remove());
    (map as any).__markers = [];
    const bounds = new mapboxgl.LngLatBounds();
    let any = false;
    const sorted = [...trip.destinations].sort((a,b) => a.order - b.order);
    sorted.forEach((d, i) => {
      const lat = d.coordinates?.lat; const lng = d.coordinates?.lng;
      if (lat != null && lng != null) {
        any = true;
        // Resolve destination color to hex
        const classes = getDestinationColors(d.id, trip.destinations, true);
        const bgToHex: Record<string, string> = {
          'bg-sky-500': '#0ea5e9',
          'bg-green-500': '#22c55e',
          'bg-purple-500': '#a855f7',
          'bg-orange-500': '#f97316',
          'bg-pink-500': '#ec4899',
          'bg-indigo-500': '#6366f1',
          'bg-red-500': '#ef4444',
          'bg-teal-500': '#14b8a6',
          'bg-yellow-500': '#eab308',
          'bg-red-800': '#991b1b',
          'bg-yellow-600': '#ca8a04',
          'bg-slate-800': '#1e293b',
          'bg-emerald-500': '#10b981',
          'bg-orange-600': '#ff6b35',
          'bg-cyan-500': '#06b6d4',
          'bg-fuchsia-500': '#d946ef',
          'bg-slate-600': '#475569'
        };
        const hex = d.customColor ? resolveColorHex(d.customColor) : (bgToHex[classes.bg] || '#0ea5e9');
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.gap = '6px';
        const circle = document.createElement('div');
        circle.style.width = '26px';
        circle.style.height = '26px';
        circle.style.borderRadius = '9999px';
        circle.style.backgroundColor = hex;
        circle.style.border = '2px solid white';
        circle.style.boxShadow = '0 2px 6px rgba(0,0,0,0.25)';
        circle.style.display = 'flex';
        circle.style.alignItems = 'center';
        circle.style.justifyContent = 'center';
        circle.style.color = 'white';
        circle.style.fontWeight = '700';
        circle.style.fontSize = '11px';
        circle.textContent = String(i + 1);
        const label = document.createElement('div');
        label.style.whiteSpace = 'nowrap';
        label.style.fontSize = '12px';
        label.style.padding = '6px 8px';
        label.style.borderRadius = '6px';
        label.style.background = 'rgba(255,255,255,0.92)';
        label.style.border = '1px solid #e5e7eb';
        label.style.boxShadow = '0 1px 2px rgba(0,0,0,0.12)';
        label.style.color = '#111827';
        label.textContent = d.name || '';
        container.appendChild(circle);
        container.appendChild(label);
        const marker = new mapboxgl.Marker({ element: container, anchor: 'left' })
          .setLngLat([lng, lat])
          .addTo(map);
        (map as any).__markers.push(marker);
        bounds.extend([lng, lat]);
      }
    });
    if (any) {
      // Increase bottom padding so markers are not obscured by the bottom calendar overlay
      map.fitBounds(bounds, { padding: { top: 64, left: 64, right: 64, bottom: 200 }, maxZoom: 9, duration: 0 });
      // Ensure map recomputes layout after bounds change
      map.resize();
    }
  }, [trip.destinations.map(d => `${d.id}:${d.order}:${d.coordinates?.lat ?? ''}:${d.coordinates?.lng ?? ''}`).join('|'), status]);

  // Right panel tabs
  const [activeTab, setActiveTab] = useState<'destinations' | 'days'>('destinations');

  return (
  <div className="fixed inset-0 bg-white z-[2147483647] flex h-screen overflow-hidden">
      {/* Map canvas area (left 2/3) with overlay */}
      <div className="relative w-[67vw] min-w-[640px] h-full min-h-0">
  <div ref={containerRef} className="w-full h-full" />
        {/* Small status badge for load/debug */}
        <div className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5 rounded bg-white/80 border border-gray-200 text-gray-700">
          Map · {status}
        </div>
        {/* Calendar overlay: centered at bottom within map area */}
        <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-4 w-[90%] max-w-[960px]">
          <div className="pointer-events-auto bg-transparent">
            <CalendarStrip
              days={trip.days}
              activeDay={selectedDay || trip.days[0]?.id || ''}
              onDaySelect={(id) => setSelectedDay(id)}
              trip={trip}
              transparent
              centered
            />
          </div>
        </div>
      </div>

      {/* Right side panel */}
  <div className="w-[33vw] min-w-[420px] border-l border-gray-200 bg-white flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex gap-2" role="tablist" aria-label="Map panel tabs">
            <button
              role="tab"
              aria-selected={activeTab === 'destinations'}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${activeTab === 'destinations' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              onClick={() => setActiveTab('destinations')}
            >
              Destinations
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'days'}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${activeTab === 'days' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              onClick={() => setActiveTab('days')}
            >
              Day by day
            </button>
          </div>
          <button
            onClick={() => setIsExpanded(false)}
            className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
          >
            Close
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          {activeTab === 'destinations' ? (
            <div className="h-full overflow-y-auto">
              {/* Reuse rail for parity with main UI */}
                <TabbedDestinationRail
                destinations={trip.destinations}
                activeDestinationId={selectedDestinationId || trip.destinations[0]?.id || ''}
                onDestinationSelect={(id) => {
                  setSelectedDestinationId(id);
                  // Recenter map on selected destination
                  const d = trip.destinations.find(x => x.id === id);
                  if (d?.coordinates && mapRef.current) {
                    mapRef.current.easeTo({ center: [d.coordinates.lng, d.coordinates.lat], zoom: Math.max(mapRef.current.getZoom() || 4, 8), padding: { top: 40, left: 40, right: 40, bottom: 200 }, duration: 300 });
                  }
                }}
                onDestinationsReorder={(dests) => onUpdateTrip({ ...trip, destinations: dests, updatedAt: new Date().toISOString() })}
                onUpdateDestination={(d) => onUpdateTrip({ ...trip, destinations: trip.destinations.map(x => x.id === d.id ? d : x), updatedAt: new Date().toISOString() })}
                onRemoveDestination={onRemoveDestination}
                onAddDestination={async () => {}}
                trip={trip}
              />
            </div>
          ) : (
            <div className="flex h-full flex-col">
              <div className="flex-1 min-h-0 overflow-y-auto">
                <TimelineView
                  trip={trip}
                  activeDestinationId={selectedDestinationId || trip.destinations[0]?.id || ''}
                  activeDay={selectedDay || trip.days[0]?.id || ''}
                  destinationRefs={{ current: {} as any }}
                  onDaysUpdate={(days) => onUpdateTrip({ ...trip, days, updatedAt: new Date().toISOString() })}
                  onDaySelect={(id) => {
                    // Update shared day selection
                    setSelectedDay(id);
                    // If this day belongs to a destination, sync destination selection and recenter map
                    const day = trip.days.find(d => d.id === id);
                    if (day?.destinationId) {
                      setSelectedDestinationId(day.destinationId);
                      const dest = trip.destinations.find(x => x.id === day.destinationId);
                      if (dest?.coordinates && mapRef.current) {
                        const { lng, lat } = dest.coordinates;
                        try {
                          mapRef.current.easeTo({ center: [lng, lat], zoom: Math.max(mapRef.current.getZoom() || 4, 8), padding: { top: 40, left: 40, right: 40, bottom: 200 }, duration: 300 });
                        } catch {}
                      }
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
