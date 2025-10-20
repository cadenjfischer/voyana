'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Trip } from '@/types/itinerary';
import { X, Map } from 'lucide-react';

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
  const [isVisible, setIsVisible] = useState(true);

  // Load visibility preference from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('tripMapVisible');
    if (saved !== null) {
      setIsVisible(saved === 'true');
    }
  }, []);

  // Save visibility preference to localStorage
  const toggleVisibility = () => {
    const newVisibility = !isVisible;
    setIsVisible(newVisibility);
    localStorage.setItem('tripMapVisible', String(newVisibility));
  };

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
        projection: { name: 'globe' },
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
      mapRef.current.resize();
    }
  }, [isExpanded]);

  // Markers + fitBounds (instant)
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // remove existing markers stored on map instance
    const existingMarkers = (map as mapboxgl.Map & { __markers?: mapboxgl.Marker[] }).__markers;
    existingMarkers?.forEach((m: mapboxgl.Marker) => m.remove());
    (map as mapboxgl.Map & { __markers?: mapboxgl.Marker[] }).__markers = [];

    const bounds = new mapboxgl.LngLatBounds();
    let hasCoordinates = false;

    trip.destinations.forEach((d, i) => {
      const lat = d.coordinates?.lat;
      const lng = d.coordinates?.lng;
      if (lat && lng) {
        hasCoordinates = true;
        const el = document.createElement('div');
        el.className = 'w-7 h-7 bg-blue-600 rounded-full border-2 border-white shadow flex items-center justify-center text-white text-xs font-bold';
        el.textContent = String(i + 1);
        const marker = new mapboxgl.Marker(el).setLngLat([lng, lat]).addTo(map);
        (map as mapboxgl.Map & { __markers?: mapboxgl.Marker[] }).__markers?.push(marker);
        bounds.extend([lng, lat]);
      }
    });

    if (hasCoordinates) {
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

  // Show floating "Show Map" button when map is hidden
  if (!isVisible) {
    return (
      <button
        onClick={toggleVisibility}
        className="fixed bottom-6 left-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg rounded-full p-3 hover:from-blue-700 hover:to-blue-800 transition-all z-[1000] flex items-center gap-2"
        title="Show Trip Map"
      >
        <Map className="w-5 h-5" />
        <span className="text-sm font-medium pr-1">Show Map</span>
      </button>
    );
  }

  return (
    <>
      <div
        className="fixed bottom-[206px] left-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg rounded-t-2xl z-[1000]"
        style={{ width: 320, height: 48 }}
      >
        <div className="flex items-center justify-between h-full px-4">
          <button
            onClick={onToggleExpand}
            className="flex items-center gap-2 flex-1 cursor-pointer"
          >
            <span className="font-semibold text-sm">Trip Map</span>
            <span className="text-xs bg-white/20 px-2 py-1 rounded">
              {trip.destinations.length} {trip.destinations.length === 1 ? 'stop' : 'stops'}
            </span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleVisibility();
            }}
            className="ml-2 p-1 hover:bg-white/20 rounded transition-colors"
            title="Hide map"
          >
            <X className="w-4 h-4" />
          </button>
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
