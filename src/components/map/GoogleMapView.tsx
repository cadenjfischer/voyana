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

  // Hide Google Maps "1 stop" style bubbles robustly (scoped to map container)
  useEffect(() => {
    if (!mapRef.current) return;

    const container = mapRef.current;

    // Helper: hide any nodes that visually show a small "x stop" badge
    const hideStopBadges = () => {
      const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT, null);
      let node: Node | null = walker.currentNode;
      while (node) {
        const el = node as HTMLElement;
        if (el && el.innerText && /\b\d+\s+stops?\b/i.test(el.innerText.trim())) {
          // Hide the nearest absolutely-positioned bubble container if present
          let target: HTMLElement | null = el;
          for (let i = 0; i < 4 && target; i++) {
            const style = window.getComputedStyle(target);
            if (style.position === 'absolute') break;
            target = target.parentElement;
          }
          (target ?? el).style.display = 'none';
          (target ?? el).style.visibility = 'hidden';
          (target ?? el).style.opacity = '0';
        }
        node = walker.nextNode();
      }
    };

    // Initial pass after mount
    const initTimer = setInterval(hideStopBadges, 200);

    // Observe DOM mutations inside the map container
    const observer = new MutationObserver(() => hideStopBadges());
    observer.observe(container, { childList: true, subtree: true, characterData: false });

    return () => {
      clearInterval(initTimer);
      observer.disconnect();
    };
  }, []);

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
      zoomControl: false,
      clickableIcons: false, // avoid POI bubbles which can surface stop labels
      // Proactively hide transit overlays which often render the "1 stop" badge
      styles: [
        { featureType: 'transit', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit.station', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit.line', stylers: [{ visibility: 'off' }] },
        { featureType: 'poi', stylers: [{ visibility: 'off' }] }
      ],
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
      markerDiv.style.cssText = `
        position: relative;
        width: 32px;
        height: 32px;
      `;

      // Create pulse rings
      const pulseRing1 = document.createElement('div');
      pulseRing1.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: ${color};
        opacity: 0.5;
        animation: pulse-${index} 2s ease-out infinite;
        pointer-events: none;
      `;

      const pulseRing2 = document.createElement('div');
      pulseRing2.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: ${color};
        opacity: 0.5;
        animation: pulse-${index} 2s ease-out infinite 1s;
        pointer-events: none;
      `;

      // Create main circle
      const circle = document.createElement('div');
      circle.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: ${color};
        opacity: 0.85;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: 700;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        box-shadow: 0 2px 8px rgba(0,0,0,0.25);
        cursor: pointer;
        transition: transform 0.2s, opacity 0.2s;
        z-index: 2;
      `;
      circle.textContent = number;

      // Add hover effect
      circle.addEventListener('mouseenter', () => {
        circle.style.transform = 'scale(1.1)';
        circle.style.opacity = '1';
      });
      circle.addEventListener('mouseleave', () => {
        circle.style.transform = 'scale(1)';
        circle.style.opacity = '0.85';
      });

      // Create keyframes animation dynamically
      const style = document.createElement('style');
      style.textContent = `
        @keyframes pulse-${index} {
          0% {
            transform: scale(1);
            opacity: 0.5;
          }
          100% {
            transform: scale(1.4);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);

      // Assemble marker
      markerDiv.appendChild(pulseRing1);
      markerDiv.appendChild(pulseRing2);
      markerDiv.appendChild(circle);

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
            // Center the marker on the point (32px / 2 = 16px offset)
            this.containerDiv.style.left = (point.x - 16) + 'px';
            this.containerDiv.style.top = (point.y - 16) + 'px';
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
