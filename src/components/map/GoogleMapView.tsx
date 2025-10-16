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

    // Add numbered circle markers with pulse animation
    coordsWithDest.forEach((item, index) => {
      const { dest, coords } = item;
      const position = { lat: coords.lat, lng: coords.lng };

      const color = resolveColorHex(dest.customColor, '#3b82f6');
      const number = (index + 1).toString();

      // Create custom HTML marker element
      const markerDiv = document.createElement('div');
      markerDiv.style.position = 'relative';
      markerDiv.style.width = '40px';
      markerDiv.style.height = '40px';
      
      // Pulse animation rings
      markerDiv.innerHTML = `
        <style>
          @keyframes pulse {
            0% {
              transform: scale(1);
              opacity: 0.6;
            }
            100% {
              transform: scale(2);
              opacity: 0;
            }
          }
          .pulse-ring {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: ${color};
            transform: translate(-50%, -50%);
            animation: pulse 2s ease-out infinite;
          }
          .pulse-ring:nth-child(2) {
            animation-delay: 0.5s;
          }
          .marker-circle {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: ${color};
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            font-weight: 700;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            box-shadow: 0 2px 8px rgba(0,0,0,0.25);
            transform: translate(-50%, -50%);
            cursor: pointer;
            transition: transform 0.2s;
          }
          .marker-circle:hover {
            transform: translate(-50%, -50%) scale(1.1);
          }
        </style>
        <div class="pulse-ring"></div>
        <div class="pulse-ring"></div>
        <div class="marker-circle">${number}</div>
      `;

      // Use OverlayView to add custom HTML to the map
      class CustomMarker extends google.maps.OverlayView {
        position: google.maps.LatLng;
        containerDiv: HTMLDivElement;

        constructor(position: google.maps.LatLng, content: HTMLDivElement) {
          super();
          this.position = position;
          this.containerDiv = content;
          this.containerDiv.style.position = 'absolute';
        }

        onAdd() {
          const panes = this.getPanes();
          panes?.overlayMouseTarget.appendChild(this.containerDiv);
          
          this.containerDiv.addEventListener('click', () => {
            if (onDestinationClick) onDestinationClick(dest);
          });
        }

        draw() {
          const projection = this.getProjection();
          const point = projection.fromLatLngToDivPixel(this.position);
          
          if (point) {
            this.containerDiv.style.left = point.x + 'px';
            this.containerDiv.style.top = point.y + 'px';
          }
        }

        onRemove() {
          if (this.containerDiv.parentElement) {
            this.containerDiv.parentElement.removeChild(this.containerDiv);
          }
        }
      }

      const overlay = new CustomMarker(
        new google.maps.LatLng(coords.lat, coords.lng),
        markerDiv
      );
      
      overlay.setMap(googleMapRef.current!);
      markersRef.current.push(overlay as any);
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
