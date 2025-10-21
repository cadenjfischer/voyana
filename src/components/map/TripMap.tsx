'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Trip } from '@/types/itinerary';
import { X, Map } from 'lucide-react';
import { getDestinationColors, resolveColorHex } from '@/utils/colors';

interface TripMapProps {
  trip: Trip;
  isExpanded: boolean;
  onToggleExpand: () => void;
  embedded?: boolean; // New prop for embedded mode (fills container)
  selectedDestinationId?: string; // Selected destination to zoom to
}

export default function TripMap({ trip, isExpanded, onToggleExpand, embedded = false, selectedDestinationId }: TripMapProps) {
  const miniRef = useRef<HTMLDivElement>(null);
  const fullRef = useRef<HTMLDivElement>(null);
  const embeddedRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const currentContainerRef = embedded ? embeddedRef : (isExpanded ? fullRef : miniRef);
  const [isVisible, setIsVisible] = useState(true);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

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
        projection: 'mercator', // Explicitly set 2D projection
      });

      mapRef.current.on('load', () => {
        setIsMapLoaded(true);
      });
    } else {
      // swap DOM container instantly
      mapRef.current.resize();
    }
  }, [isExpanded, embedded]);

  // Markers + fitBounds (instant)
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded) return;
    const map = mapRef.current;

    // Remove existing line layer/source if present
    if (map.getLayer('route-line')) map.removeLayer('route-line');
    if (map.getSource('route-line')) map.removeSource('route-line');

    // remove existing markers stored on map instance
    const existingMarkers = (map as mapboxgl.Map & { __markers?: mapboxgl.Marker[] }).__markers;
    existingMarkers?.forEach((m: mapboxgl.Marker) => m.remove());
    (map as mapboxgl.Map & { __markers?: mapboxgl.Marker[] }).__markers = [];

    const bounds = new mapboxgl.LngLatBounds();
    let hasCoordinates = false;
    const lineCoords: [number, number][] = [];

    // Sort destinations by order
    const sorted = [...trip.destinations].sort((a, b) => a.order - b.order);

    sorted.forEach((d, i) => {
      const lat = d.coordinates?.lat;
      const lng = d.coordinates?.lng;
      if (lat && lng) {
        hasCoordinates = true;
        lineCoords.push([lng, lat]);

        // Get destination color
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

        const el = document.createElement('div');
        el.className = 'w-7 h-7 rounded-full border-2 border-white shadow flex items-center justify-center text-white text-xs font-bold';
        el.style.backgroundColor = hex;
        el.textContent = String(i + 1);
        const marker = new mapboxgl.Marker(el).setLngLat([lng, lat]).addTo(map);
        (map as mapboxgl.Map & { __markers?: mapboxgl.Marker[] }).__markers?.push(marker);
        bounds.extend([lng, lat]);
      }
    });

    // Add connecting line between destinations
    if (lineCoords.length > 1) {
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

    if (hasCoordinates) {
      // Use larger padding to ensure both destinations are visible
      // Use object notation for different padding on each side
      // Extra padding on bottom and right to account for floating button and UI elements
      const padding = embedded 
        ? { top: 60, bottom: 220, left: 60, right: 160 } 
        : 40;
      map.fitBounds(bounds, { 
        padding: padding, 
        duration: 0,
        maxZoom: 12 // Prevent zooming in too close when destinations are far apart
      });
    }
  }, [trip.destinations, isMapLoaded]);

  // Zoom to selected destination
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded || !selectedDestinationId) return;
    
    const selectedDestination = trip.destinations.find(d => d.id === selectedDestinationId);
    if (selectedDestination && selectedDestination.coordinates) {
      const { lat, lng } = selectedDestination.coordinates;
      
      mapRef.current.flyTo({
        center: [lng, lat],
        zoom: 10,
        duration: 1500,
        essential: true
      });
    }
  }, [selectedDestinationId, trip.destinations, isMapLoaded]);

  // Embedded mode - fills the container
  if (embedded) {
    return <div ref={embeddedRef} className="w-full h-full overflow-hidden" />;
  }

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
