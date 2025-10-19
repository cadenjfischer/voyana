'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Trip } from '@/types/itinerary';

interface TripMapProps {
  trip: Trip;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export default function TripMap({ trip, isExpanded, onToggleExpand }: TripMapProps) {
  const miniRef = useRef<HTMLDivElement>(null);
  const fullRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const currentContainerRef = isExpanded ? fullRef : miniRef;

  // Init once, then move container when expanded
  useEffect(() => {
    if (!currentContainerRef.current) return;

    if (!mapRef.current) {
      const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
      if (!token) return;
      mapboxgl.accessToken = token;

      mapRef.current = new mapboxgl.Map({
        container: currentContainerRef.current,
        style: 'mapbox://styles/mapbox/outdoors-v12',
        center: [-98, 38.5],
        zoom: 3,
        projection: 'globe' as any,
      });

      mapRef.current.on('load', () => {
        mapRef.current?.setFog({
          color: 'rgb(220, 230, 240)',
          'high-color': 'rgb(180, 200, 220)',
          'horizon-blend': 0.02,
        });
      });
    } else {
      // swap DOM container instantly
      (mapRef.current as any).resize();
    }
  }, [isExpanded]);

  // Markers + fitBounds (instant)
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // remove existing markers stored on map instance
    (map as any).__markers?.forEach((m: mapboxgl.Marker) => m.remove());
    (map as any).__markers = [];

    const bounds = new mapboxgl.LngLatBounds();
    let any = false;

    trip.destinations.forEach((d, i) => {
      const lat = d.coordinates?.lat;
      const lng = d.coordinates?.lng;
      if (lat && lng) {
        any = true;
        const el = document.createElement('div');
        el.className = 'w-7 h-7 bg-blue-600 rounded-full border-2 border-white shadow flex items-center justify-center text-white text-xs font-bold';
        el.textContent = String(i + 1);
        const marker = new mapboxgl.Marker(el).setLngLat([lng, lat]).addTo(map);
        (map as any).__markers.push(marker);
        bounds.extend([lng, lat]);
      }
    });

    if (any) {
      map.fitBounds(bounds, { padding: 50, duration: 0 });
    }
  }, [trip.destinations]);

  if (isExpanded) {
    return (
      <div className="fixed inset-0 z-[1000] bg-white">
        <button
          className="absolute top-4 right-4 z-[1001] bg-white rounded-lg px-4 py-2 shadow hover:bg-gray-50"
          onClick={onToggleExpand}
        >
          Close Map
        </button>
        <div ref={fullRef} className="w-full h-full" />
      </div>
    );
  }

  return (
    <>
      <div
        className="fixed bottom-[206px] left-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg rounded-t-2xl cursor-pointer z-[1000]"
        style={{ width: 320, height: 48 }}
        onClick={onToggleExpand}
      >
        <div className="flex items-center justify-between h-full px-4">
          <span className="font-semibold text-sm">Trip Map</span>
          <span className="text-xs bg-white/20 px-2 py-1 rounded">
            {trip.destinations.length} {trip.destinations.length === 1 ? 'stop' : 'stops'}
          </span>
        </div>
      </div>

      <div
        className="fixed bottom-6 left-6 bg-white rounded-2xl shadow-2xl overflow-hidden cursor-pointer z-[1000]"
        style={{ width: 320, height: 200 }}
        onClick={onToggleExpand}
      >
        <div ref={miniRef} className="w-full h-full" />
      </div>
    </>
  );
}
