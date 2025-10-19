'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Destination } from '@/types/itinerary';
import { resolveColorHex } from '@/utils/colors';

interface MapboxMapViewProps {
  destinations: Destination[];
  className?: string;
  onDestinationClick?: (destination: Destination) => void;
  onMapReady?: (map: mapboxgl.Map) => void;
}

export default function MapboxMapView({
  destinations,
  className = '',
  onDestinationClick,
  onMapReady,
}: MapboxMapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize Mapbox map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!token) {
      console.error('Mapbox token missing');
      return;
    }

    // Wait for container to have dimensions
    const initTimer = setTimeout(() => {
      if (!containerRef.current) return;

      console.log('MapboxMapView: initializing map...');
      mapboxgl.accessToken = token;

      try {
        const map = new mapboxgl.Map({
          container: containerRef.current,
          style: 'mapbox://styles/mapbox/outdoors-v12',
          center: [0, 20],
          zoom: 2,
          projection: { name: 'globe' } as any,
        });

        map.on('load', () => {
          console.log('MapboxMapView: map loaded');
          setIsLoaded(true);
          onMapReady?.(map);
          
          // Force resize
          setTimeout(() => {
            map.resize();
          }, 100);
        });

        map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');

        mapRef.current = map;
      } catch (error) {
        console.error('MapboxMapView: error creating map', error);
      }
    }, 100);

    return () => {
      clearTimeout(initTimer);
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [onMapReady]);

  // Render/refresh markers
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return;

    // clear
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const items = destinations.filter((d) => d.coordinates).map((d, i) => ({ d, i }));
    if (items.length === 0) return;

    items.forEach(({ d, i }) => {
      const color = resolveColorHex(d.customColor, '#3b82f6');
      const el = document.createElement('div');
      el.style.cssText = `position:relative;width:32px;height:32px;`;

      const pulse1 = document.createElement('div');
      pulse1.style.cssText = `position:absolute;inset:0;border-radius:50%;background:${color};opacity:.5;animation:pulse-${i} 2s ease-out infinite;pointer-events:none;`;
      const pulse2 = document.createElement('div');
      pulse2.style.cssText = `position:absolute;inset:0;border-radius:50%;background:${color};opacity:.5;animation:pulse-${i} 2s ease-out infinite 1s;pointer-events:none;`;

      const circle = document.createElement('div');
      circle.style.cssText = `position:absolute;inset:0;border-radius:50%;background:${color};opacity:.9;color:#fff;display:flex;align-items:center;justify-content:center;font:bold 14px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.25);cursor:pointer;z-index:2;`;
      circle.textContent = String(i + 1);

      circle.addEventListener('mouseenter', () => (circle.style.opacity = '1'));
      circle.addEventListener('mouseleave', () => (circle.style.opacity = '.9'));
      circle.addEventListener('click', () => onDestinationClick && onDestinationClick(d));

      const style = document.createElement('style');
      style.textContent = `@keyframes pulse-${i}{0%{transform:scale(1);opacity:.5}100%{transform:scale(1.4);opacity:0}}`;
      document.head.appendChild(style);

      el.appendChild(pulse1);
      el.appendChild(pulse2);
      el.appendChild(circle);

      const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat([d.coordinates!.lng, d.coordinates!.lat])
        .addTo(mapRef.current!);
      markersRef.current.push(marker);
    });
  }, [destinations, isLoaded, onDestinationClick]);

  return (
    <div className={className} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div 
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0
        }}
      />
      {!isLoaded && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f3f4f6',
          zIndex: 1000,
          pointerEvents: 'none'
        }}>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Loading map...</p>
        </div>
      )}
    </div>
  );
}
