 'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { Trip } from '@/types/itinerary';

interface MiniMapProps {
  trip: Trip;
  width?: number;
  height?: number;
  className?: string;
}

// A lightweight, fixed-position mini map for the itinerary page.
export default function MiniMap({ trip, width = 320, height = 200, className = '' }: MiniMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [status, setStatus] = useState<'mount' | 'no-token' | 'init' | 'loaded'>('mount');
  const [portalEl, setPortalEl] = useState<HTMLDivElement | null>(null);

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
        cooperativeGestures: true,
      });

      mapRef.current.on('load', () => {
        mapRef.current?.resize();
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

  // Add markers and fit bounds instantly when destinations change
  useEffect(() => {
  const map = mapRef.current;
    if (!map) return;

    // Remove existing markers
    (map as any).__mini_markers?.forEach((m: mapboxgl.Marker) => m.remove());
    (map as any).__mini_markers = [];

    const bounds = new mapboxgl.LngLatBounds();
    let any = false;

    trip.destinations.forEach((d, i) => {
      const lat = d.coordinates?.lat;
      const lng = d.coordinates?.lng;
      if (lat != null && lng != null) {
        any = true;
        const el = document.createElement('div');
        el.className = 'w-5 h-5 rounded-full bg-blue-600 border-2 border-white shadow';
        const marker = new mapboxgl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map);
        (map as any).__mini_markers.push(marker);
        bounds.extend([lng, lat]);
      }
    });

    if (any) {
      map.fitBounds(bounds, { padding: 32, maxZoom: 8, duration: 0 });
    }
  }, [trip.destinations]);

  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const noToken = !token;

  const content = (
    <div
      className={`fixed bottom-6 left-6 rounded-2xl overflow-hidden shadow-2xl bg-white border border-gray-200 pointer-events-auto ${className}`}
      style={{ width, height, zIndex: 2147483647 }}
      aria-label="Itinerary mini map"
    >
      {/* Always-visible label to confirm mount */}
      <div className="absolute top-1 left-2 z-[1] text-[10px] font-medium text-gray-600 bg-white/80 px-1.5 py-0.5 rounded">
        Mini Map · {status}
      </div>
      {noToken ? (
        <div className="w-full h-full flex items-center justify-center text-xs text-gray-600">
          Add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
        </div>
      ) : (
        <div ref={containerRef} className="w-full h-full" />
      )}
    </div>
  );

  if (!portalEl) return null;
  return createPortal(content, portalEl);
}
