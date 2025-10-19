'use client';

import MapboxMapView from './MapboxMapView';
import { Destination } from '@/types/itinerary';

interface GoogleMapViewProps {
  destinations: Destination[];
  className?: string;
  onDestinationClick?: (destination: Destination) => void;
  onMapReady?: (map: any) => void;
}

// Legacy GoogleMapView now redirects to MapboxMapView
export default function GoogleMapView({
  destinations,
  className = '',
  onDestinationClick,
  onMapReady
}: GoogleMapViewProps) {
  return (
    <MapboxMapView
      destinations={destinations}
      className={className}
      onDestinationClick={onDestinationClick}
      onMapReady={onMapReady}
    />
  );
}
