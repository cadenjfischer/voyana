 'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { Trip } from '@/types/itinerary';
import { useItineraryUI } from '@/contexts/ItineraryUIContext';

interface MiniMapProps {
  trip: Trip;
  width?: number;
  height?: number;
  className?: string;
  centerOn?: { lat: number; lng: number } | null;
}

// A lightweight, fixed-position mini map for the itinerary page.
export default function MiniMap({ trip, width = 320, height = 200, className = '', centerOn = null }: MiniMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [status, setStatus] = useState<'mount' | 'no-token' | 'init' | 'loaded'>('mount');
  const [portalEl, setPortalEl] = useState<HTMLDivElement | null>(null);
  const { isExpanded, setIsExpanded } = useItineraryUI();
  const cameraRef = useRef<{ center: mapboxgl.LngLatLike; zoom: number } | null>(null);
  const [fallbackCoords, setFallbackCoords] = useState<Record<string, { lat: number; lng: number }>>({});

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
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Add markers (numbered by visit order) with visible labels and fit bounds when destinations change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== 'loaded') return;

    // Remove existing markers
    (map as any).__mini_markers?.forEach((m: mapboxgl.Marker) => m.remove());
    (map as any).__mini_markers = [];

    const bounds = new mapboxgl.LngLatBounds();
    let any = false;

    // Use visit order for numbering (1-based)
    const sorted = [...trip.destinations].sort((a, b) => a.order - b.order);
    sorted.forEach((d, i) => {
      const lat = d.coordinates?.lat ?? fallbackCoords[d.id]?.lat;
      const lng = d.coordinates?.lng ?? fallbackCoords[d.id]?.lng;
      if (lat != null && lng != null) {
        any = true;
        // Container for marker + label
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.gap = '6px';
        container.style.pointerEvents = 'auto';

        // Numbered circle
        const circle = document.createElement('div');
        circle.style.width = '24px';
        circle.style.height = '24px';
        circle.style.borderRadius = '9999px';
        circle.style.backgroundColor = '#2563eb'; // blue-600
        circle.style.border = '2px solid white';
        circle.style.boxShadow = '0 2px 6px rgba(0,0,0,0.25)';
        circle.style.display = 'flex';
        circle.style.alignItems = 'center';
        circle.style.justifyContent = 'center';
        circle.style.color = 'white';
        circle.style.fontWeight = '700';
        circle.style.fontSize = '10px';
        circle.textContent = String(i + 1);

        // Always-visible label with destination name
        const label = document.createElement('div');
        label.style.whiteSpace = 'nowrap';
        label.style.fontSize = '11px';
        label.style.lineHeight = '1';
        label.style.padding = '4px 6px';
        label.style.borderRadius = '6px';
        label.style.background = 'rgba(255,255,255,0.9)';
        label.style.border = '1px solid #e5e7eb'; // gray-200
        label.style.boxShadow = '0 1px 2px rgba(0,0,0,0.12)';
        label.style.color = '#111827'; // gray-900
        label.textContent = d.name || '';

        container.appendChild(circle);
        container.appendChild(label);
        if (d.name) container.title = d.name;

        const marker = new mapboxgl.Marker({ element: container, anchor: 'left' })
          .setLngLat([lng, lat])
          .addTo(map);
        (map as any).__mini_markers.push(marker);
        bounds.extend([lng, lat]);
      }
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

  const content = (
    <>
      {/* Backdrop for expanded mode handled by ExpandedMap, not here */}

      <div
        className={`fixed ${isExpanded ? 'inset-0' : 'bottom-6 left-6'} rounded-2xl overflow-hidden shadow-2xl bg-white border border-gray-200 pointer-events-auto ${className}`}
        style={{ width: isExpanded ? '100vw' as any : width, height: isExpanded ? '100vh' as any : height, zIndex }}
        aria-label="Itinerary mini map"
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
        {/* Header */}
        {/* Expand button in mini mode */}
        {!isExpanded && (
          <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 2, display: 'flex', gap: 8 }}>
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
              style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', cursor: 'pointer' }}
            >
              Expand
            </button>
          </div>
        )}

        {/* Status label (small) */}
        {!isExpanded && (
          <div className="absolute top-1 left-2 z-[1] text-[10px] font-medium text-gray-600 bg-white/80 px-1.5 py-0.5 rounded">
            Mini Map · {status}
          </div>
        )}

        {noToken ? (
          <div className="w-full h-full flex items-center justify-center text-xs text-gray-600">
            Add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
          </div>
        ) : (
          <div ref={containerRef} className="w-full h-full" />
        )}
      </div>
    </>
  );

  if (!portalEl) return null;
  return createPortal(content, portalEl);
}
