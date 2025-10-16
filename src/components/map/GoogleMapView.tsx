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
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker`;
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

    // Add markers with custom styled pins
    coordsWithDest.forEach((item, index) => {
      const { dest, coords } = item;
      const position = { lat: coords.lat, lng: coords.lng };

      const color = resolveColorHex(dest.customColor, '#3b82f6');

      // Create a custom SVG marker
      const svgMarker = {
        path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
        fillColor: color,
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        scale: 1.5,
        anchor: new google.maps.Point(12, 22),
      };

      const marker = new google.maps.Marker({
        position,
        map: googleMapRef.current!,
        title: dest.name,
        icon: svgMarker,
        label: {
          text: dest.name,
          color: '#222222',
          fontSize: '13px',
          fontWeight: '600',
          className: 'map-marker-label',
        },
      });

      marker.addListener('click', () => {
        if (onDestinationClick) onDestinationClick(dest);
      });

      markersRef.current.push(marker);
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
