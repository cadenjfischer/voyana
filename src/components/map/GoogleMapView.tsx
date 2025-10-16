'use client';

import { useEffect, useRef, useState } from 'react';
import { Destination } from '@/types/itinerary';
import { resolveColorHex } from '@/utils/colors';

interface GoogleMapViewProps {
  destinations: Destination[];
  className?: string;
  onDestinationClick?: (destination: Destination) => void;
  onMapReady?: (map: google.maps.Map) => void;
}

export default function GoogleMapView({
  destinations,
  className = '',
  onDestinationClick,
  onMapReady
}: GoogleMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load Google Maps script (only once globally)
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      console.error('Google Maps API key not found');
      return;
    }

    if (window.google?.maps) {
      setIsLoaded(true);
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => setIsLoaded(true));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.onload = () => setIsLoaded(true);
    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || googleMapRef.current) return;

    const map = new google.maps.Map(mapRef.current, {
      zoom: 2,
      center: { lat: 20, lng: 0 },
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
      zoomControl: true,
      mapId: '24567cdfd6a1cc8d15db29d9', // Custom vector map style
    });

    googleMapRef.current = map;
    if (onMapReady) onMapReady(map);
  }, [isLoaded, onMapReady]);

  // Update markers when destinations change
  useEffect(() => {
    if (!googleMapRef.current || !isLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    const coordsWithDest = destinations
      .filter(d => d.coordinates)
      .map(d => ({ dest: d, coords: d.coordinates! }));

    if (coordsWithDest.length === 0) return;

    // Add markers
    coordsWithDest.forEach((item, index) => {
      const { dest, coords } = item;
      const position = { lat: coords.lat, lng: coords.lng };

      const color = resolveColorHex(dest.customColor, '#3b82f6');

      // Create advanced marker with custom HTML
      const markerDiv = document.createElement('div');
      markerDiv.className = 'custom-map-marker';
      markerDiv.style.cssText = `
        display: flex;
        align-items: center;
        gap: 6px;
        background: white;
        padding: 6px 12px;
        border-radius: 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 13px;
        font-weight: 600;
        color: #222;
        white-space: nowrap;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
      `;
      markerDiv.innerHTML = `
        <div style="width: 12px; height: 12px; background: ${color}; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 0 1px rgba(0,0,0,0.1);"></div>
        <span>${dest.name}</span>
      `;

      markerDiv.addEventListener('mouseenter', () => {
        markerDiv.style.transform = 'scale(1.05)';
        markerDiv.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
      });

      markerDiv.addEventListener('mouseleave', () => {
        markerDiv.style.transform = 'scale(1)';
        markerDiv.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
      });

      markerDiv.addEventListener('click', () => {
        if (onDestinationClick) onDestinationClick(dest);
      });

      const marker = new google.maps.marker.AdvancedMarkerElement({
        position,
        map: googleMapRef.current!,
        title: dest.name,
        content: markerDiv,
      });

      markersRef.current.push(marker as any);
    });
  }, [destinations, isLoaded, onDestinationClick]);

  if (!isLoaded) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <p className="text-sm text-gray-500">Loading map...</p>
      </div>
    );
  }

  return <div ref={mapRef} className={className} />;
}
