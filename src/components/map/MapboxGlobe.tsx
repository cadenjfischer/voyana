'use client';

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import mapboxgl from 'mapbox-gl';
import { Destination, Day, Activity } from '@/types/itinerary';

export interface MapboxGlobeRef {
  fitToDestinations: (destinations: Destination[]) => void;
  highlightDay: (day: Day | null) => void;
  setSelectedDestinations: (destinations: Destination[]) => void;
}

interface MapboxGlobeProps {
  destinations: Destination[];
  selectedDay?: Day | null;
  onDestinationClick?: (destination: Destination) => void;
  onActivityClick?: (activity: Activity) => void;
  className?: string;
}

const MapboxGlobe = forwardRef<MapboxGlobeRef, MapboxGlobeProps>(({
  destinations,
  selectedDay,
  onDestinationClick,
  onActivityClick,
  className = ""
}, ref) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Get Mapbox token from environment
  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  useImperativeHandle(ref, () => ({
    fitToDestinations: (dests: Destination[]) => {
      if (!map.current || !isLoaded || dests.length === 0) return;

      const coordinates = dests
        .filter(dest => dest.coordinates)
        .map(dest => [dest.coordinates!.lng, dest.coordinates!.lat] as [number, number]);

      if (coordinates.length === 0) return;

      if (coordinates.length === 1) {
        map.current.flyTo({
          center: coordinates[0],
          zoom: 8,
          duration: 1000
        });
      } else {
        const bounds = coordinates.reduce((bounds, coord) => {
          return bounds.extend(coord);
        }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

        map.current.fitBounds(bounds, {
          padding: 40,
          duration: 1000,
          maxZoom: 8
        });
      }
    },
    highlightDay: (day: Day | null) => {
      // Implementation for highlighting specific day's activities
      // This would filter markers and routes based on the selected day
    },
    setSelectedDestinations: (dests: Destination[]) => {
      if (isLoaded) {
        updateMarkers(dests);
      }
    }
  }));

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN || map.current) {
      return;
    }

    try {
      console.log('Initializing Mapbox map with token:', MAPBOX_TOKEN?.substring(0, 20) + '...');
      
      mapboxgl.accessToken = MAPBOX_TOKEN;

      // Create map with minimal configuration
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11', // Use older, more stable style
        center: [2.3522, 48.8566],
        zoom: 4,
        attributionControl: true
      });

      map.current.on('load', () => {
        console.log('Map loaded successfully');
        setIsLoaded(true);
        setMapError(null);
      });

      map.current.on('error', (e) => {
        console.error('Mapbox error:', e.error);
        setMapError(e.error?.message || 'Map failed to load');
        setIsLoaded(false);
      });

      map.current.on('sourcedata', (e) => {
        if (e.isSourceLoaded) {
          console.log('Map source data loaded');
        }
      });

    } catch (error) {
      console.error('Map initialization error:', error);
      setMapError(error instanceof Error ? error.message : 'Failed to initialize map');
    }

    return () => {
      if (map.current) {
        console.log('Cleaning up map');
        map.current.remove();
        map.current = null;
      }
    };
  }, []); // Remove dependencies to prevent re-initialization

  // Simple marker update function
  const updateMarkers = (dests: Destination[]) => {
    if (!map.current || !isLoaded) {
      console.log('Cannot update markers:', { mapLoaded: !!map.current, isLoaded });
      return;
    }

    try {
      console.log('Updating markers for', dests.length, 'destinations');
      
      // Clear existing markers
      markers.current.forEach(marker => marker.remove());
      markers.current = [];

      // Add simple markers for destinations with coordinates
      dests.forEach((destination, index) => {
        if (!destination.coordinates) {
          console.log('No coordinates for', destination.name);
          return;
        }

        console.log('Adding marker for', destination.name, destination.coordinates);

        // Create simple marker
        const marker = new mapboxgl.Marker()
          .setLngLat([destination.coordinates.lng, destination.coordinates.lat])
          .addTo(map.current!);

        markers.current.push(marker);
      });

      // Fit to show destinations
      if (dests.length > 0) {
        const coordinates = dests
          .filter(dest => dest.coordinates)
          .map(dest => [dest.coordinates!.lng, dest.coordinates!.lat] as [number, number]);

        if (coordinates.length === 1) {
          map.current.flyTo({
            center: coordinates[0],
            zoom: 8,
            duration: 1000
          });
        } else if (coordinates.length > 1) {
          const bounds = coordinates.reduce((bounds, coord) => {
            return bounds.extend(coord);
          }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

          map.current.fitBounds(bounds, {
            padding: 40,
            duration: 1000
          });
        }
      }
    } catch (error) {
      console.error('Error updating markers:', error);
    }
  };

  // Update markers when destinations change
  useEffect(() => {
    updateMarkers(destinations);
  }, [destinations, isLoaded]);

  // Highlight selected day
  useEffect(() => {
    if (!map.current || !selectedDay) return;

    // Find destinations active on this day
    const dayDestinations = destinations.filter(dest => {
      const dayDate = new Date(selectedDay.date);
      const startDate = new Date(dest.startDate);
      const endDate = new Date(dest.endDate);
      return dayDate >= startDate && dayDate <= endDate;
    });

    // Update marker styles for highlighting
    markers.current.forEach((marker, index) => {
      const destination = destinations[index];
      const isHighlighted = dayDestinations.some(dest => dest.id === destination?.id);
      
      const markerElement = marker.getElement();
      if (markerElement) {
        markerElement.style.opacity = isHighlighted ? '1' : '0.4';
        markerElement.style.transform = isHighlighted ? 'scale(1.1)' : 'scale(1)';
      }
    });
  }, [selectedDay, destinations]);

  const getDestinationColor = (destination: Destination, index: number): string => {
    if (destination.customColor) {
      // Use custom color from destination
      const colorMap: { [key: string]: string } = {
        'coral': '#FF6B6B',
        'ocean': '#4ECDC4',
        'sunset': '#FFD93D',
        'lavender': '#A8E6CF',
        'sky': '#74B9FF',
        'rose': '#FD79A8',
        'mint': '#00B894',
        'peach': '#FDCB6E'
      };
      return colorMap[destination.customColor] || '#6366f1';
    }
    
    // Fallback colors
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#f97316', '#3b82f6', '#ef4444'];
    return colors[index % colors.length];
  };

  if (!MAPBOX_TOKEN) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 text-gray-500`}>
        <div className="text-center p-4">
          <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <p className="text-sm">Mapbox token required</p>
          <p className="text-xs mt-1">Token: {MAPBOX_TOKEN ? 'Found' : 'Missing'}</p>
        </div>
      </div>
    );
  }

  if (mapError) {
    return (
      <div className={`${className} flex items-center justify-center bg-red-50 text-red-600 rounded-lg`}>
        <div className="text-center p-4">
          <p className="text-sm font-medium">Map Error</p>
          <p className="text-xs mt-1">{mapError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} relative`}>
      <div 
        ref={mapContainer} 
        className="w-full h-full bg-gray-200 rounded-lg"
        style={{ 
          minHeight: '200px',
          width: '100%',
          height: '100%'
        }}
      />
      {!isLoaded && !mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-90 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-xs text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
});

MapboxGlobe.displayName = 'MapboxGlobe';

export default MapboxGlobe;