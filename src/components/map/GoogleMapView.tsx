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

  // Load Google Maps script
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

      // Create marker
      const marker = new google.maps.Marker({
        position,
        map: googleMapRef.current!,
        title: dest.name,
        label: {
          text: dest.name,
          color: 'white',
          fontSize: '12px',
          fontWeight: 'bold',
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: 'white',
          strokeWeight: 2,
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
