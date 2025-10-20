 'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { Trip } from '@/types/itinerary';
import { getDestinationColors, resolveColorHex } from '@/utils/colors';
import { useItineraryUI } from '@/contexts/ItineraryUIContext';
import { X, Map as MapIcon } from 'lucide-react';

interface MiniMapProps {
  trip: Trip;
  width?: number;
  height?: number;
  className?: string;
  centerOn?: { lat: number; lng: number } | null;
}

// A lightweight, fixed-position mini map for the itinerary page.
export default function MiniMap({ trip, width = 320, height = 200, className = '', centerOn = null }: MiniMapProps) {
  const instanceId = useRef(Math.random().toString(36).substring(7));
  console.log('🏗️ MiniMap INSTANCE:', instanceId.current);
  
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [status, setStatus] = useState<'mount' | 'no-token' | 'init' | 'loaded'>('mount');
  const [portalEl, setPortalEl] = useState<HTMLDivElement | null>(null);
  const { isExpanded, setIsExpanded, isMiniMapVisible: isVisible, setIsMiniMapVisible: setIsVisible } = useItineraryUI();
  const cameraRef = useRef<{ center: mapboxgl.LngLatLike; zoom: number } | null>(null);
  const [fallbackCoords, setFallbackCoords] = useState<Record<string, { lat: number; lng: number }>>({});
  const [mapKey, setMapKey] = useState(0); // Force remount when needed
  const hasToggledRef = useRef(false); // Track if we've toggled at least once
  const isTogglingRef = useRef(false); // Prevent double-toggle

  // Save visibility preference to localStorage and handle map resize  
  const toggleVisibility = () => {
    // Prevent double-clicks/double-calls
    if (isTogglingRef.current) {
      console.log('⚠️ TOGGLE BLOCKED - already toggling');
      return;
    }
    
    isTogglingRef.current = true;
    console.log('🔴 TOGGLE CALLED - current isVisible:', isVisible);
    hasToggledRef.current = true;
    
    const newVisibility = !isVisible;
    console.log('🔵 Setting to:', newVisibility);
    
    // Save to localStorage synchronously
    localStorage.setItem('miniMapVisible', String(newVisibility));
    
    // Update state
    setIsVisible(newVisibility);
    
    // Reset toggle lock after state update
    setTimeout(() => {
      isTogglingRef.current = false;
    }, 100);
    
    // If showing the map again, resize it after a short delay
    if (newVisibility) {
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.resize();
          // Trigger a repaint by forcing a small camera movement
          const center = mapRef.current.getCenter();
          mapRef.current.jumpTo({ center: [center.lng, center.lat] });
        }
      }, 100);
    }
  };

  // Resize map when visibility changes
  useEffect(() => {
    if (isVisible && mapRef.current && status === 'loaded') {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.resize();
          // Force a render by triggering a minimal camera update
          const center = mapRef.current.getCenter();
          const zoom = mapRef.current.getZoom();
          mapRef.current.jumpTo({ center: [center.lng, center.lat], zoom });
        }
      }, 50);
    }
  }, [isVisible, status]);

  // Prepare a body-level portal so the overlay isn't clipped by stacking contexts
  useEffect(() => {
    const el = document.createElement('div');
    el.setAttribute('data-minimap-portal', '');
    document.body.appendChild(el);
    setPortalEl(el);
    return () => {
      el.remove();
      setPortalEl(null);
    };
  }, []);

  // Cleanup map on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Initialize the map; retry until the container exists
  useEffect(() => {
    let cancelled = false;
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!token) {
      setStatus('no-token');
      return;
    }

    const tryInit = () => {
      if (cancelled) return;
      if (!containerRef.current) {
        requestAnimationFrame(tryInit);
        return;
      }
      if (mapRef.current) return;

      mapboxgl.accessToken = token;
      setStatus('init');
      mapRef.current = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-98, 38.5],
        zoom: 2.8,
        attributionControl: false,
        projection: 'mercator', // force 2D projection
      });

      mapRef.current.on('load', () => {
        mapRef.current?.resize();
        // Ensure a 2D flat map experience
        try {
          mapRef.current?.setProjection('mercator');
        } catch {}
        mapRef.current?.setPitch(0);
        mapRef.current?.setBearing(0);
        // Disable rotation interactions
        try { mapRef.current?.dragRotate?.disable(); } catch {}
        try { mapRef.current?.touchZoomRotate?.disableRotation(); } catch {}
        // Ensure normal scroll-to-zoom behavior (no Cmd key requirement)
        try { mapRef.current?.scrollZoom?.enable(); } catch {}
        setStatus('loaded');
      });
    };

    tryInit();

    return () => {
      cancelled = true;
      // Don't remove map, we'll do that in the main cleanup effect
    };
  }, []); // Only run once on mount

  // Add markers (numbered by visit order) with visible labels and fit bounds when destinations change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== 'loaded') return;

    // Remove existing line layer/source if present (do this BEFORE removing markers)
    if (map.getLayer('mini-route-line')) map.removeLayer('mini-route-line');
    if (map.getSource('mini-route-line')) map.removeSource('mini-route-line');

    // Remove existing markers
    (map as unknown as { __mini_markers?: mapboxgl.Marker[] }).__mini_markers?.forEach((m: mapboxgl.Marker) => m.remove());
    (map as unknown as { __mini_markers?: mapboxgl.Marker[] }).__mini_markers = [];

    const bounds = new mapboxgl.LngLatBounds();
    let any = false;
    const lineCoords: [number, number][] = [];

    // Use visit order for numbering (1-based)
    const sorted = [...trip.destinations].sort((a, b) => a.order - b.order);
    
    // Collect coordinates and marker data
    const svgMarkers: Array<{lng: number, lat: number, hex: string, number: number, name: string}> = [];
    
    sorted.forEach((d, i) => {
      const lat = d.coordinates?.lat ?? fallbackCoords[d.id]?.lat;
      const lng = d.coordinates?.lng ?? fallbackCoords[d.id]?.lng;
      if (lat != null && lng != null) {
        lineCoords.push([lng, lat]);
        
        // Match destination color
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
      map.addSource('mini-route-line', {
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
        id: 'mini-route-line',
        type: 'line',
        source: 'mini-route-line',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#94a3b8',
          'line-width': 1.5,
          'line-dasharray': [2, 4],
          'line-opacity': 1
        }
      });
    }
    
    // Create markers with center anchor and separate labels
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
      container.style.top = '-14px'; // Half of 28px to center
      container.style.left = '-14px'; // Half of 28px to center
      container.style.width = '28px';
      container.style.height = '28px';
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
      el.style.fontSize = '11px';
      el.textContent = String(marker.number);
      
      container.appendChild(ring);
      container.appendChild(el);
      wrapper.appendChild(container);
      
      const mapMarker = new mapboxgl.Marker({ element: wrapper, anchor: 'center' })
        .setLngLat([marker.lng, marker.lat])
        .addTo(map);
      
      (map as unknown as { __mini_markers: mapboxgl.Marker[] }).__mini_markers.push(mapMarker);
      
      // Add label as separate marker (hidden by default, shown on hover)
      const labelEl = document.createElement('div');
      labelEl.style.whiteSpace = 'nowrap';
      labelEl.style.fontSize = '11px';
      labelEl.style.lineHeight = '1';
      labelEl.style.padding = '4px 6px';
      labelEl.style.borderRadius = '6px';
      labelEl.style.background = 'rgba(255,255,255,0.9)';
      labelEl.style.border = '1px solid #e5e7eb';
      labelEl.style.boxShadow = '0 1px 2px rgba(0,0,0,0.12)';
      labelEl.style.color = '#111827';
      labelEl.style.pointerEvents = 'none';
      labelEl.style.opacity = '0';
      labelEl.style.transition = 'opacity 0.2s ease-in-out';
      labelEl.textContent = marker.name;
      
      const labelMarker = new mapboxgl.Marker({ element: labelEl, anchor: 'left', offset: [20, 0] })
        .setLngLat([marker.lng, marker.lat])
        .addTo(map);
      
      (map as unknown as { __mini_markers: mapboxgl.Marker[] }).__mini_markers.push(labelMarker);
      
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
      map.fitBounds(bounds, { padding: 32, maxZoom: 8, duration: 0 });
    }
  }, [
    // Recompute markers when order or coordinates change
    trip.destinations
      .map(d => `${d.id}:${d.order}:${d.coordinates?.lat ?? ''}:${d.coordinates?.lng ?? ''}`)
      .join('|'),
    // Also update when fallback coords change
    Object.entries(fallbackCoords).map(([id, c]) => `${id}:${c.lat}:${c.lng}`).join('|'),
    status
  ]);

  // Fallback geocoding for destinations missing coordinates (first load/new trips)
  useEffect(() => {
    let cancelled = false;
    const needs = trip.destinations.filter(d => !d.coordinates && !fallbackCoords[d.id]);
    if (needs.length === 0) return;

    const knownCoords = (name: string): { lat: number; lng: number } | null => {
      const n = name.toLowerCase();
      if (n.includes('paris')) return { lat: 48.8566, lng: 2.3522 };
      if (n.includes('london')) return { lat: 51.5074, lng: -0.1278 };
      if (n.includes('nice')) return { lat: 43.7102, lng: 7.2620 };
      if (n.includes('rome')) return { lat: 41.9028, lng: 12.4964 };
      if (n.includes('barcelona')) return { lat: 41.3851, lng: 2.1734 };
      if (n.includes('amsterdam')) return { lat: 52.3676, lng: 4.9041 };
      if (n.includes('new york')) return { lat: 40.7128, lng: -74.0060 };
      if (n.includes('tokyo')) return { lat: 35.6762, lng: 139.6503 };
      if (n.includes('colorado') && !n.includes('springs')) return { lat: 39.0, lng: -105.5 };
      if (n.includes('california')) return { lat: 36.7783, lng: -119.4179 };
      if (n.includes('florida')) return { lat: 27.9944, lng: -81.7603 };
      return null;
    };

    const fetchOne = async (dest: { id: string; name: string }) => {
      // Try known coords immediately for instant feedback
      const kc = knownCoords(dest.name);
      if (kc && !cancelled) {
        setFallbackCoords(prev => ({ ...prev, [dest.id]: kc }));
        return; // Skip network call if we have a good known match
      }
      try {
        const res = await fetch(`/api/places/search?query=${encodeURIComponent(dest.name)}`);
        if (!res.ok) return;
        const data = await res.json();
        const place = data?.results?.[0];
        const lat = place?.geometry?.location?.lat;
        const lng = place?.geometry?.location?.lng;
        if (!cancelled && typeof lat === 'number' && typeof lng === 'number') {
          setFallbackCoords(prev => ({ ...prev, [dest.id]: { lat, lng } }));
        }
      } catch {
        /* ignore */
      }
    };

    // Stagger requests a bit
    needs.forEach((d, idx) => {
      setTimeout(() => fetchOne({ id: d.id, name: d.name }), idx * 120);
    });

    return () => { cancelled = true; };
  }, [trip.destinations.map(d => `${d.id}:${d.name}:${!!d.coordinates}`).join('|')]);

  // Respond to external center requests (e.g., when selecting a destination in the list)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !centerOn) return;
    map.jumpTo({ center: [centerOn.lng, centerOn.lat], zoom: Math.max(map.getZoom() || 3, 11) });
  }, [centerOn]);

  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const noToken = !token;

  const isDev = process.env.NODE_ENV !== 'production';
  const zIndex = isDev ? 1000 : 2147483647; // In dev, let Next.js error toasts sit above the mini map

  // Debug logging
  console.log('MiniMap render:', { isVisible, isExpanded, showButton: !isVisible && !isExpanded });

  const content = (
    <>
      {/* Show Map Button - Only visible when map is truly hidden */}
      {!isVisible && !isExpanded && (
        <button
          onClick={() => {
            toggleVisibility();
            // Give the map time to become visible before resizing
            setTimeout(() => {
              if (mapRef.current) {
                mapRef.current.resize();
                // Fit bounds to show all destinations
                const coords = trip.destinations
                  .filter(d => d.coordinates)
                  .map(d => ({ lat: d.coordinates!.lat, lng: d.coordinates!.lng }));
                if (coords.length > 0) {
                  const bounds = new mapboxgl.LngLatBounds();
                  coords.forEach(c => bounds.extend([c.lng, c.lat]));
                  mapRef.current.fitBounds(bounds, { padding: 40, maxZoom: 9, duration: 800 });
                }
              }
            }, 150);
          }}
          className="fixed bottom-6 left-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg rounded-full p-3 hover:from-blue-700 hover:to-blue-800 transition-all flex items-center gap-2"
          style={{ zIndex }}
          title="Show Trip Map"
        >
          <MapIcon className="w-5 h-5" />
          <span className="text-sm font-medium pr-1">Show Map</span>
        </button>
      )}

      {/* Map Container - Always rendered but hidden when isVisible is false */}
      <div
        style={{ 
          position: 'fixed',
          bottom: isExpanded ? 0 : '1.5rem',
          left: isExpanded ? 0 : '1.5rem',
          top: isExpanded ? 0 : 'auto',
          right: isExpanded ? 0 : 'auto',
          width: isExpanded ? '100vw' : width, 
          height: isExpanded ? '100vh' : 'auto',
          zIndex,
          display: isVisible || isExpanded ? 'block' : 'none',
          visibility: isVisible || isExpanded ? 'visible' : 'hidden',
          opacity: isVisible || isExpanded ? 1 : 0,
          pointerEvents: isVisible || isExpanded ? 'auto' : 'none'
        }}
        aria-label="Itinerary mini map"
      >
        {/* Mini map header - Only show when visible */}
        {!isExpanded && isVisible && (
          <div style={{ 
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', 
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (mapRef.current) {
                  // Reset to show all destinations
                  const bounds = new mapboxgl.LngLatBounds();
                  trip.destinations.forEach(d => {
                    if (d.coordinates) {
                      bounds.extend([d.coordinates.lng, d.coordinates.lat]);
                    }
                  });
                  if (!bounds.isEmpty()) {
                    mapRef.current.fitBounds(bounds, { padding: 40, maxZoom: 9, duration: 800 });
                  }
                }
              }}
              style={{ background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: '11px', fontWeight: 600, color: '#1e40af', transition: 'all 0.2s' }}
              title="Reset map view"
              onMouseEnter={(e) => e.currentTarget.style.background = 'white'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.9)'}
            >
              Reset
            </button>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'white', letterSpacing: '0.5px' }}>Map</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (mapRef.current) {
                    const c = mapRef.current.getCenter();
                    const z = mapRef.current.getZoom();
                    cameraRef.current = { center: [c.lng, c.lat], zoom: z };
                  }
                  setIsExpanded(true);
                  setTimeout(() => mapRef.current?.resize(), 0);
                }}
                style={{ background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: '11px', fontWeight: 600, color: '#1e40af', transition: 'all 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'white'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.9)'}
              >
                Expand
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Save current camera position before hiding
                  if (mapRef.current) {
                    const c = mapRef.current.getCenter();
                    const z = mapRef.current.getZoom();
                    cameraRef.current = { center: [c.lng, c.lat], zoom: z };
                  }
                  toggleVisibility();
                }}
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 6, padding: '4px 6px', cursor: 'pointer', color: 'white', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Hide map"
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Map container */}
        <div
          className={`${isExpanded ? 'rounded-none' : 'rounded-b-2xl'} overflow-hidden shadow-2xl bg-white border border-gray-200`}
          style={{ height: isExpanded ? '100vh' : height }}
          onClick={() => {
            if (!isExpanded) {
              if (mapRef.current) {
                const c = mapRef.current.getCenter();
                const z = mapRef.current.getZoom();
                cameraRef.current = { center: [c.lng, c.lat], zoom: z };
              }
              setIsExpanded(true);
              setTimeout(() => mapRef.current?.resize(), 0);
            }
          }}
        >
          {noToken ? (
            <div className="w-full h-full flex items-center justify-center text-xs text-gray-600">
              Add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
            </div>
          ) : (
            <div ref={containerRef} className="w-full h-full" />
          )}
        </div>
      </div>
    </>
  );

  if (!portalEl) return null;
  return createPortal(content, portalEl);
}
