'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { Trip, Destination } from '@/types/itinerary';
import { useItineraryUI } from '@/contexts/ItineraryUIContext';
import TabbedDestinationRail from '@/components/itinerary/TabbedDestinationRail';
import CalendarStrip from '@/components/itinerary/CalendarStrip';
import TimelineView from '@/components/itinerary/TimelineView';
import { getDestinationColors, resolveColorHex } from '@/utils/colors';

interface ExpandedMapProps {
  trip: Trip;
  onUpdateTrip: (trip: Trip) => void;
  onRemoveDestination?: (destinationId: string) => void;
  onAddDestination?: (destination: Omit<Destination, 'id' | 'order'>) => void;
}

export default function ExpandedMap({ trip, onUpdateTrip, onRemoveDestination, onAddDestination }: ExpandedMapProps) {
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
    
    // Remove existing line layer/source if present (do this BEFORE removing markers)
    if (map.getLayer('route-line')) map.removeLayer('route-line');
    if (map.getSource('route-line')) map.removeSource('route-line');
    
    (map as unknown as { __markers?: mapboxgl.Marker[] }).__markers?.forEach((m: mapboxgl.Marker) => m.remove());
    (map as unknown as { __markers?: mapboxgl.Marker[] }).__markers = [];
    
    const bounds = new mapboxgl.LngLatBounds();
    let any = false;
    const sorted = [...trip.destinations].sort((a,b) => a.order - b.order);
    const lineCoords: [number, number][] = [];
    
    // Collect coordinates and create SVG data
    const svgMarkers: Array<{lng: number, lat: number, hex: string, number: number, name: string}> = [];
    
    sorted.forEach((d, i) => {
      const lat = d.coordinates?.lat; const lng = d.coordinates?.lng;
      if (lat != null && lng != null) {
        lineCoords.push([lng, lat]);
        
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
        
        svgMarkers.push({
          lng,
          lat,
          hex,
          number: i + 1,
          name: d.name || ''
        });
      }
    });
    
    // Add connecting line between destinations
    if (lineCoords.length > 1) {
      any = true;
      map.addSource('route-line', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: lineCoords
          }
        }
      });
      
      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route-line',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#94a3b8',
          'line-width': 2,
          'line-dasharray': [2, 4],
          'line-opacity': 1
        }
      });
    }
    
    // Create SVG markers using Mapbox symbol layer
    svgMarkers.forEach((marker) => {
      any = true;
      
      // Create wrapper to hold both ring and circle
      const wrapper = document.createElement('div');
      wrapper.style.position = 'relative';
      wrapper.style.width = '0';
      wrapper.style.height = '0';
      
      // Container for circle + pulsing ring - positioned relative to the wrapper
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.top = '-16px'; // Half of 32px to center
      container.style.left = '-16px'; // Half of 32px to center
      container.style.width = '32px';
      container.style.height = '32px';
      container.style.cursor = 'pointer';
      
      // Pulsing ring behind the circle
      const ring = document.createElement('div');
      ring.style.position = 'absolute';
      ring.style.top = '0';
      ring.style.left = '0';
      ring.style.width = '100%';
      ring.style.height = '100%';
      ring.style.borderRadius = '50%';
      ring.style.border = `2px solid ${marker.hex}`;
      ring.style.animation = 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite';
      
      // Solid circle
      const el = document.createElement('div');
      el.style.position = 'absolute';
      el.style.top = '0';
      el.style.left = '0';
      el.style.width = '100%';
      el.style.height = '100%';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = marker.hex;
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.color = 'white';
      el.style.fontWeight = '700';
      el.style.fontSize = '13px';
      el.textContent = String(marker.number);
      
      container.appendChild(ring);
      container.appendChild(el);
      wrapper.appendChild(container);
      
      const mapMarker = new mapboxgl.Marker({ element: wrapper, anchor: 'center' })
        .setLngLat([marker.lng, marker.lat])
        .addTo(map);
      
      (map as unknown as { __markers: mapboxgl.Marker[] }).__markers.push(mapMarker);
      
      // Add label as separate marker (hidden by default, shown on hover)
      const labelEl = document.createElement('div');
      labelEl.style.whiteSpace = 'nowrap';
      labelEl.style.fontSize = '12px';
      labelEl.style.padding = '6px 8px';
      labelEl.style.borderRadius = '6px';
      labelEl.style.background = 'rgba(255,255,255,0.92)';
      labelEl.style.border = '1px solid #e5e7eb';
      labelEl.style.boxShadow = '0 1px 2px rgba(0,0,0,0.12)';
      labelEl.style.color = '#111827';
      labelEl.style.pointerEvents = 'none';
      labelEl.style.opacity = '0';
      labelEl.style.transition = 'opacity 0.2s ease-in-out';
      labelEl.textContent = marker.name;
      
      const labelMarker = new mapboxgl.Marker({ element: labelEl, anchor: 'left', offset: [22, 0] })
        .setLngLat([marker.lng, marker.lat])
        .addTo(map);
      
      (map as unknown as { __markers: mapboxgl.Marker[] }).__markers.push(labelMarker);
      
      // Show/hide label on hover
      wrapper.addEventListener('mouseenter', () => {
        labelEl.style.opacity = '1';
      });
      wrapper.addEventListener('mouseleave', () => {
        labelEl.style.opacity = '0';
      });
      
      bounds.extend([marker.lng, marker.lat]);
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
        
        {/* Reset button overlay: top-right corner */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={() => {
              if (mapRef.current) {
                const bounds = new mapboxgl.LngLatBounds();
                trip.destinations.forEach(d => {
                  if (d.coordinates) {
                    bounds.extend([d.coordinates.lng, d.coordinates.lat]);
                  }
                });
                if (!bounds.isEmpty()) {
                  mapRef.current.fitBounds(bounds, { padding: { top: 64, left: 64, right: 64, bottom: 200 }, maxZoom: 9, duration: 800 });
                }
              }
            }}
            style={{ 
              background: 'white', 
              border: '1px solid #e5e7eb', 
              borderRadius: 6, 
              padding: '6px 12px', 
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
              cursor: 'pointer', 
              fontSize: '13px', 
              fontWeight: 600, 
              color: '#111827' 
            }}
            title="Reset map view"
          >
            Reset
          </button>
        </div>

        {/* Calendar overlay: centered at bottom within map area */}
        <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4">
          <div className="pointer-events-auto bg-transparent w-full max-w-full overflow-x-auto">
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
                expandedDestinationIds={new Set([selectedDestinationId || ''])}
                onDestinationSelect={(id) => {
                  setSelectedDestinationId(id);
                  // Recenter map on selected destination
                  const d = trip.destinations.find(x => x.id === id);
                  if (d?.coordinates && mapRef.current) {
                    mapRef.current.easeTo({ center: [d.coordinates.lng, d.coordinates.lat], zoom: Math.max(mapRef.current.getZoom() || 4, 8), padding: { top: 40, left: 40, right: 40, bottom: 200 }, duration: 800 });
                  }
                }}
                onDestinationsReorder={(dests) => {
                  // Reassign days when reordering (same logic as SyncedSplitView)
                  const sortedDestinations = [...dests].sort((a, b) => a.order - b.order);
                  let dayIndex = 0;
                  const updatedDays = trip.days.map(day => ({ ...day, destinationId: undefined as string | undefined }));
                  
                  for (let destIndex = 0; destIndex < sortedDestinations.length; destIndex++) {
                    const destination = sortedDestinations[destIndex];
                    if (destination.nights === 0) continue;
                    
                    const hasActiveNextDestination = sortedDestinations.slice(destIndex + 1).some(dest => dest.nights > 0);
                    const daysToAssign = hasActiveNextDestination ? destination.nights : destination.nights + 1;
                    
                    for (let i = 0; i < daysToAssign && dayIndex < updatedDays.length; i++) {
                      updatedDays[dayIndex] = { ...updatedDays[dayIndex], destinationId: destination.id };
                      dayIndex++;
                    }
                  }
                  
                  onUpdateTrip({ ...trip, destinations: dests, days: updatedDays, updatedAt: new Date().toISOString() });
                }}
                onUpdateDestination={(d) => {
                  // Update destinations
                  const updatedDestinations = trip.destinations.map(x => x.id === d.id ? d : x);
                  
                  // Reassign days based on nights (same logic as SyncedSplitView)
                  const sortedDestinations = [...updatedDestinations].sort((a, b) => a.order - b.order);
                  let dayIndex = 0;
                  const updatedDays = trip.days.map(day => ({ ...day, destinationId: undefined as string | undefined }));
                  
                  for (let destIndex = 0; destIndex < sortedDestinations.length; destIndex++) {
                    const destination = sortedDestinations[destIndex];
                    if (destination.nights === 0) continue;
                    
                    const hasActiveNextDestination = sortedDestinations.slice(destIndex + 1).some(dest => dest.nights > 0);
                    const daysToAssign = hasActiveNextDestination ? destination.nights : destination.nights + 1;
                    
                    for (let i = 0; i < daysToAssign && dayIndex < updatedDays.length; i++) {
                      updatedDays[dayIndex] = { ...updatedDays[dayIndex], destinationId: destination.id };
                      dayIndex++;
                    }
                  }
                  
                  onUpdateTrip({ ...trip, destinations: updatedDestinations, days: updatedDays, updatedAt: new Date().toISOString() });
                }}
                onRemoveDestination={onRemoveDestination}
                onAddDestination={(dest) => {
                  console.log('ExpandedMap onAddDestination called with:', dest);
                  onAddDestination?.(dest);
                }}
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
                  destinationRefs={{ current: {} as Record<string, HTMLDivElement> }}
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
                          mapRef.current.easeTo({ center: [lng, lat], zoom: Math.max(mapRef.current.getZoom() || 4, 8), padding: { top: 40, left: 40, right: 40, bottom: 200 }, duration: 800 });
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
