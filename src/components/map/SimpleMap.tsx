'use client';

import { useEffect, useRef, useState } from 'react';
import { useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { Destination } from '@/types/itinerary';
import { PREMIUM_COLOR_PALETTE, resolveColorHex } from '@/utils/colors';
const { resolveColorHex: legacyResolve } = require('@/utils/colors');

interface SimpleMapProps {
  destinations?: Destination[];
  className?: string;
  onDestinationClick?: (destination: Destination) => void;
  focusedDestination?: Destination | null;
  forceRefreshKey?: number;
  centerOn?: { lat: number; lng: number } | null;
  onCentered?: () => void;
}

export default function SimpleMap({ destinations = [], className = "", onDestinationClick, focusedDestination = null, forceRefreshKey, centerOn, onCentered }: SimpleMapProps) {
  // When parent requests center on coordinates, fly to them
  useEffect(() => {
    if (!map.current) return;
    if (!centerOn) return;
    try {
      map.current.flyTo({ center: [centerOn.lng, centerOn.lat], zoom: 8, duration: 600 });
      // Notify parent after move completes
      const handler = () => {
        try { onCentered?.(); } catch (e) {}
      };
      map.current.once('moveend', handler);
    } catch (e) {
      console.error('SimpleMap: failed to center on requested coords', e);
    }
  }, [centerOn]);
  // Force map resize and style reload when forceRefreshKey changes
  useEffect(() => {
    if (!map.current) return;
    map.current.resize();
    const currentStyle = 'mapbox://styles/mapbox/streets-v11';
    map.current.setStyle(currentStyle);
    // Also repaint canvas background
    try {
      const canvas = map.current.getCanvas();
        if (canvas) {
        // Do not force a solid background color here. Use transparent so the
        // Mapbox style (ocean, atmosphere, etc.) can render correctly. Setting
        // a gray background caused the blue ocean to appear briefly then be
        // visually overridden.
        canvas.style.background = 'transparent';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.display = 'block';
      }
    } catch (e) {}
  }, [forceRefreshKey]);

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [mapState, setMapState] = useState<string>('initializing');

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!MAPBOX_TOKEN) {
      setMapState('no-token');
      console.warn('SimpleMap: no Mapbox token found');
      return;
    }

    // Wait a bit for the container to be fully rendered and have dimensions
    const initTimer = setTimeout(() => {
      if (!mapContainer.current) return;
      
      setMapState('creating-map');
      console.log('SimpleMap: creating map...');

      try {
        mapboxgl.accessToken = MAPBOX_TOKEN;

        // Calculate initial center - will be adjusted by fitBounds anyway
        const initialCenter = (() => {
          const firstDestWithCoords = destinations.find(d => d.coordinates);
          if (firstDestWithCoords?.coordinates) {
            console.log('Using first destination center:', firstDestWithCoords.name, firstDestWithCoords.coordinates);
            return [firstDestWithCoords.coordinates.lng, firstDestWithCoords.coordinates.lat];
          }
          return [0, 20]; // Default to world view
        })();

        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v11',
          center: initialCenter as [number, number],
          zoom: 2, // Start zoomed out, will fit bounds once markers are added
          pitch: 0, // No tilt
          bearing: 0, // No rotation
          dragRotate: false, // Disable rotation with right-click or ctrl+drag
          pitchWithRotate: false, // Disable pitch when rotating
          touchPitch: false // Disable pitch on touch devices
        });

        // On load: try to ensure canvas is properly sized and tiles render
        map.current.on('load', () => {
          console.log('SimpleMap: map load event');
          
          // Force a resize in case the container was hidden/zero-sized when initialized
          map.current?.resize();
          
          // Trigger an additional resize a bit later and reapply style.
          // Reapply transparent canvas background after setStyle in case the
          // Mapbox style reload replaces inline canvas styles.
          setTimeout(() => {
            map.current?.resize();
            // Force a style reload to trigger tile re-download/render
            const currentStyle = 'mapbox://styles/mapbox/streets-v11';
            map.current?.setStyle(currentStyle);

            // Reapply transparent canvas background after style reload
            try {
              const canvasAfter = map.current ? map.current.getCanvas() : null;
              if (canvasAfter) {
                canvasAfter.style.background = 'transparent';
                canvasAfter.style.width = '100%';
                canvasAfter.style.height = '100%';
                canvasAfter.style.display = 'block';
              }
            } catch (e) {
              // ignore
            }
          }, 200);

          // Ensure canvas has a visible background and fills container
          try {
            const canvas = map.current ? map.current.getCanvas() : null;
            if (canvas) {
              // Preserve transparency so the globe/ocean layers are visible.
              canvas.style.background = 'transparent';
              canvas.style.width = '100%';
              canvas.style.height = '100%';
              canvas.style.display = 'block';
            }
            // Debug canvas and container sizes/styles
            try {
              const rect = canvas ? canvas.getBoundingClientRect() : null;
              console.log('SimpleMap: canvas rect', rect);
              const parent = mapContainer.current?.parentElement;
              if (parent) {
                const pRect = parent.getBoundingClientRect();
                const style = window.getComputedStyle(parent);
                console.log('SimpleMap: parent rect', pRect, 'parent styles', {
                  zIndex: style.zIndex,
                  background: style.backgroundColor,
                  display: style.display,
                  visibility: style.visibility
                });
              }
            } catch (e) {
              console.error('Error reading canvas/container rects', e);
            }
          } catch (e) {
            console.error('Error styling canvas:', e);
          }
          
          setMapState('ready');
        });

        map.current.on('idle', () => {
          console.log('SimpleMap: map idle (tiles loaded)');
        });

        // Additional map events for debugging
        map.current.on('error', (e) => {
          console.error('SimpleMap: map error', e);
        });

      } catch (error) {
        console.error('SimpleMap: error creating map', error);
        setMapState('error');
      }
    }, 100); // Short delay to ensure container is rendered

    // Cleanup
    return () => {
      clearTimeout(initTimer);
      markers.current.forEach(marker => marker.remove());
      markers.current = [];
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Helper to get destination color
  const getDestinationColor = (destination: Destination, index: number): string => {
    // If destination has a customColor id, map to its hex from PREMIUM_COLOR_PALETTE
    // resolve via helper which supports legacy ids
    const resolved = resolveColorHex(destination.customColor, ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'][index % 6]);
    console.log('SimpleMap marker color:', {
      name: destination.name,
      customColor: destination.customColor,
      resolvedHex: resolved,
      index
    });
    return resolved;
  };

  // Update markers when destinations or focus changes
  const updateMarkers = useCallback(() => {
    if (!map.current) {
      console.log('Map not ready yet');
      return;
    }

    console.log('Updating markers for', destinations.length, 'destinations');
    console.log('Destinations:', destinations.map(d => ({ name: d.name, hasCoords: !!d.coordinates, coords: d.coordinates })));

  // Do not clear markers immediately; keep existing markers visible
  // while the map animates. We'll clear them right before we add new
  // markers inside addMarkersAfterMove to avoid a flash.

    // Only proceed if we have destinations with coordinates
    const destinationsWithCoords = destinations.filter(dest => dest.coordinates);
    console.log(`${destinationsWithCoords.length} of ${destinations.length} destinations have coordinates`);
    
    if (destinationsWithCoords.length === 0) {
      console.log('No destinations with coordinates to display');
      return;
    }

    // Calculate bounds FIRST before adding markers
    const coordinates = destinationsWithCoords.map(dest => 
      [dest.coordinates!.lng, dest.coordinates!.lat] as [number, number]
    );

    // Function to add markers after map has moved to correct position
    const addMarkersAfterMove = () => {
      // Clear existing markers right before creating new ones so they
      // remain visible during any map movement/animation.
      markers.current.forEach(marker => marker.remove());
      markers.current = [];

      destinationsWithCoords.forEach((destination, index) => {
        if (!destination.coordinates) return;
        
        console.log('Adding marker for', destination.name, 'at coordinates:', destination.coordinates);

        // Create marker with precise positioning
        const el = document.createElement('div');
        el.style.cssText = `
          display: flex;
          flex-direction: column;
          align-items: center;
          pointer-events: auto;
          cursor: pointer;
        `;
        
        // Label above the pin
        const label = document.createElement('div');
        label.textContent = destination.name;
        label.style.cssText = `
          background: ${getDestinationColor(destination, index)};
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: bold;
          white-space: nowrap;
          box-shadow: 0 1px 4px rgba(0,0,0,0.3);
          border: 1px solid white;
          margin-bottom: 2px;
        `;
        
        // Pin point
        const pin = document.createElement('div');
        pin.style.cssText = `
          width: 8px;
          height: 8px;
          background: ${getDestinationColor(destination, index)};
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 1px 3px rgba(0,0,0,0.4);
        `;
        
        el.appendChild(label);
        el.appendChild(pin);
        
        console.log('Created marker element for', destination.name);

        el.addEventListener('click', () => {
          onDestinationClick?.(destination);
        });

        // Use bottom anchor so the pin point sits exactly on the coordinate
        const marker = new mapboxgl.Marker({
          element: el,
          anchor: 'bottom'
        })
          .setLngLat([destination.coordinates.lng, destination.coordinates.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(`
                <div class="p-2">
                  <h3 class="font-semibold text-sm">${destination.name}</h3>
                  <p class="text-xs text-gray-600">${destination.nights} nights</p>
                </div>
              `)
          )
          .addTo(map.current!);
          
        console.log('Marker added to map for', destination.name, 'at', [destination.coordinates.lng, destination.coordinates.lat]);

        markers.current.push(marker);
      });
    };

    // Fit bounds to show ALL destinations, then add markers
    if (coordinates.length === 1) {
      // Single destination: center on it with comfortable zoom
      map.current.flyTo({
        center: coordinates[0],
        zoom: 10,
        duration: 800,
        padding: { top: 50, bottom: 50, left: 50, right: 50 }
      });
      console.log('Centering on single destination:', coordinates[0]);
      
      // Add markers after animation completes, or immediately if the
      // map isn't moving (no animation will fire moveend).
      try {
        if (map.current.isMoving && map.current.isMoving()) {
          map.current.once('moveend', addMarkersAfterMove);
        } else {
          addMarkersAfterMove();
        }
      } catch (e) {
        // In case isMoving isn't available on this map build, fall back
        // to waiting for moveend to be safe.
        map.current.once('moveend', addMarkersAfterMove);
      }
      
    } else if (coordinates.length > 1) {
      // Multiple destinations: fit bounds to show all destinations
      const bounds = coordinates.reduce((bounds, coord) => {
        return bounds.extend(coord);
      }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

      map.current.fitBounds(bounds, {
        padding: { top: 120, bottom: 120, left: 120, right: 120 }, // Increased padding for breathing room
        duration: 800,
        maxZoom: 12, // Prevent over-zooming when destinations are very close
        linear: false
      });
      
      console.log('Fitting bounds for', coordinates.length, 'destinations');
      
      // Add markers after fitBounds animation completes, or immediately if
      // the map isn't moving.
      try {
        if (map.current.isMoving && map.current.isMoving()) {
          map.current.once('moveend', addMarkersAfterMove);
        } else {
          addMarkersAfterMove();
        }
      } catch (e) {
        map.current.once('moveend', addMarkersAfterMove);
      }
    }

  }, [destinations, focusedDestination, onDestinationClick]);

  // Update markers when destinations or focus changes
  useEffect(() => {
    if (map.current && mapState === 'ready') {
      updateMarkers();
    }
  }, [destinations, focusedDestination, updateMarkers, mapState]);

  // Fallback resize/style reload
  useEffect(() => {
    if (!map.current) return;
    
    const timer = setTimeout(() => {
      console.log('SimpleMap: fallback resize/style reload');
      map.current?.resize();
      const currentStyle = 'mapbox://styles/mapbox/streets-v11';
      map.current?.setStyle(currentStyle);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`relative ${className}`} style={{ zIndex: 20, background: 'transparent' }}>
      <div 
        ref={mapContainer} 
        className="w-full h-full rounded-lg"
        style={{ minHeight: '200px', background: 'transparent' }}
      />
      {mapState === 'no-token' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <p className="text-sm text-gray-500">Map token not configured</p>
        </div>
      )}
      {mapState === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <p className="text-sm text-gray-500">Error loading map</p>
        </div>
      )}
    </div>
  );
}
