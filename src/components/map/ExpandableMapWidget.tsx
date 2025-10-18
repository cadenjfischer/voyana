'use client';

import React, { useState, useEffect, useRef } from 'react';
import GoogleMapView from '@/components/map/GoogleMapView';
import CalendarStrip from '@/components/itinerary/CalendarStrip';
import ExpandedMapSidePanel from '@/components/itinerary/ExpandedMapSidePanel';
import { Destination, Day, Activity } from '@/types/itinerary';
import { useItineraryUI } from '@/contexts/ItineraryUIContext';

interface ExpandableMapWidgetProps {
  trip: import('@/types/itinerary').Trip;
  destinations: Destination[];
  selectedDay?: Day | null;
  onDestinationClick?: (destination: Destination) => void;
  onActivityClick?: (activity: Activity) => void;
  centerOn?: { lat: number; lng: number } | null;
  onCentered?: () => void;
  onDaySelect?: (day: Day) => void;
  onUpdateDestination?: (destination: Destination) => void;
  onRemoveDestination?: (destinationId: string) => void;
  onAddDestination?: (destination: Omit<Destination, 'id' | 'order'>) => void;
  onDaysUpdate?: (days: Day[]) => void;
  onUpdateTrip?: (trip: import('@/types/itinerary').Trip) => void;
  onActiveDay?: (dayId: string) => void;
  onDestinationMapCenterRequest?: (coords: { lat: number; lng: number } | null) => void;
}

export default function ExpandableMapWidget({
  trip,
  destinations,
  selectedDay,
  onDestinationClick,
  onActivityClick,
  onDaySelect,
  centerOn,
  onCentered,
  onUpdateDestination,
  onRemoveDestination,
  onAddDestination,
  onDaysUpdate,
  onUpdateTrip,
  onActiveDay,
  onDestinationMapCenterRequest
}: ExpandableMapWidgetProps) {
  const { isExpanded, setIsExpanded, selectedDay: selectedDayIndex, setSelectedDay: setSelectedDayIndex } = useItineraryUI();
  const [focusedDestinationId, setFocusedDestinationId] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  // destinationRefs used only by removed side panel components; keep placeholder if needed in future
  // const destinationRefs = useRef<{ [key: string]: HTMLDivElement }>({});
  const googleMapRef = useRef<google.maps.Map | null>(null);
  // Remember mini-map camera so collapsing restores exactly the same view
  const miniCameraRef = useRef<{ center: google.maps.LatLngLiteral; zoom: number } | null>(null);
  const skipNextMiniFitRef = useRef<boolean>(false);
  
  // Calendar responsiveness
  const calendarContainerRef = useRef<HTMLDivElement | null>(null);
  const calendarInnerRef = useRef<HTMLDivElement | null>(null);
  const [calendarScale, setCalendarScale] = useState<number>(1);
  const [calendarScrollable, setCalendarScrollable] = useState<boolean>(false);
  const MIN_CALENDAR_SCALE = 0.85;
  const SIDE_PADDING = 24;
  const SCALE_BUFFER = 1.05;
  
  const [miniMapHeight, setMiniMapHeight] = useState(200);
  
  useEffect(() => {
    const updateMiniMapHeight = () => {
      const viewportAspectRatio = window.innerHeight / window.innerWidth;
      const miniMapWidth = 320;
      setMiniMapHeight(miniMapWidth * viewportAspectRatio);
    };
    
    updateMiniMapHeight();
    window.addEventListener('resize', updateMiniMapHeight);
    return () => window.removeEventListener('resize', updateMiniMapHeight);
  }, []);

  useEffect(() => {
    const container = calendarContainerRef.current;
    const inner = calendarInnerRef.current;
    if (!container || !inner) return;

    const updateScale = () => {
      const containerRect = container.getBoundingClientRect();
      const innerRect = inner.getBoundingClientRect();
      const naturalWidth = innerRect.width / (calendarScale || 1);
      const available = containerRect.width - SIDE_PADDING * 2;
      const desired = Math.min(1, (available / naturalWidth) / SCALE_BUFFER);
      const scale = Math.max(desired, MIN_CALENDAR_SCALE);
      
      setCalendarScale(scale);
      setCalendarScrollable(desired < MIN_CALENDAR_SCALE);
    };

    const ro = new ResizeObserver(() => updateScale());
    ro.observe(container);
    ro.observe(inner);
    requestAnimationFrame(updateScale);

    return () => ro.disconnect();
  }, [isExpanded, calendarScale]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isExpanded) {
        event.preventDefault();
        setIsExpanded(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  useEffect(() => {
    if (destinations && destinations.length > 0) {
      setFocusedDestinationId(destinations[0].id);
    } else {
      setFocusedDestinationId(null);
    }
  }, [destinations, isMapReady]);

  // Fit bounds when destinations change or layout changes (expanded/mini)
  // When expanded, account for the right-side panel (1/3 width) and bottom calendar overlay.
  // We slightly inflate the geographic bounds so the resulting fit isn't overly tight
  // without doing a post-fit zoom tweak.
  useEffect(() => {
    if (!googleMapRef.current || destinations.length === 0) return;

    const coords = destinations
      .filter(d => d.coordinates)
      .map(d => ({ lat: d.coordinates!.lat, lng: d.coordinates!.lng }));

    if (coords.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    coords.forEach(coord => bounds.extend(coord));

    // Inflate bounds by a factor so fitBounds picks a slightly wider zoom naturally.
    const inflateBounds = (b: google.maps.LatLngBounds, factor: number) => {
      const ne = b.getNorthEast();
      const sw = b.getSouthWest();
      let latSpan = ne.lat() - sw.lat();
      let lngSpan = ne.lng() - sw.lng();

      // For single-point or nearly identical points, use a sensible minimum span.
      const MIN_SPAN = 0.25; // ~25km at equator; adjust as needed
      if (latSpan < MIN_SPAN) latSpan = MIN_SPAN;
      if (lngSpan < MIN_SPAN) lngSpan = MIN_SPAN;

      const latPad = (latSpan * (factor - 1)) / 2;
      const lngPad = (lngSpan * (factor - 1)) / 2;

      const inflated = new google.maps.LatLngBounds(
        new google.maps.LatLng(sw.lat() - latPad, sw.lng() - lngPad),
        new google.maps.LatLng(ne.lat() + latPad, ne.lng() + lngPad)
      );
      return inflated;
    };

    const padding = isExpanded
      ? {
          top: 130, // header height buffer
          bottom: 190, // calendar overlay clearance
          left: 110,
          right: Math.round(window.innerWidth / 3) + 180, // shift view into left 2/3
        }
      : { top: 24, bottom: 24, left: 24, right: 24 };

    const map = googleMapRef.current;

    // If we just collapsed from expanded → mini, restore the exact mini camera once
    if (!isExpanded && skipNextMiniFitRef.current) {
      const prev = miniCameraRef.current;
      if (prev) {
        map.setZoom(prev.zoom);
        map.setCenter(prev.center);
      }
      skipNextMiniFitRef.current = false;
      return;
    }
  // Only inflate in expanded mode; mini map should be tighter
  const targetBounds = isExpanded ? inflateBounds(bounds, 1.25) : bounds;
  map.fitBounds(targetBounds, padding);
  }, [destinations, isMapReady, isExpanded]);

  // Resize map without changing zoom/center (prevents over-zoom on expand)
  const resizeWithoutCameraChange = () => {
    if (!googleMapRef.current) return;
    google.maps.event.trigger(googleMapRef.current, 'resize');
  };

  const handleMapClick = () => {
    if (!isExpanded) {
      // Save current mini camera so we can restore it on collapse
      if (googleMapRef.current) {
        const c = googleMapRef.current.getCenter();
        const z = googleMapRef.current.getZoom() ?? 2;
        if (c) miniCameraRef.current = { center: { lat: c.lat(), lng: c.lng() }, zoom: z };
      }
      setIsExpanded(true);
      // Notify Google the container size changed so fitBounds can compute correctly
      setTimeout(() => resizeWithoutCameraChange(), 60);
    }
  };

  const handleCloseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // On collapse, skip the next mini fit and restore the saved mini camera
    skipNextMiniFitRef.current = true;
    setIsExpanded(false);
    // On collapse, just notify Google the container size changed
    setTimeout(() => resizeWithoutCameraChange(), 50);
  };
  return (
    <>
      {/* Backdrop */}
      {isExpanded && (
        <div 
          aria-hidden
          onClick={handleCloseClick}
          className="fixed inset-0 bg-black opacity-40 z-45"
        />
      )}

      {/* Mini Map Header */}
      <div 
        className="fixed bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg z-50"
        style={{
          top: isExpanded ? '-48px' : `calc(100vh - ${miniMapHeight + 54}px)`,
          left: isExpanded ? 0 : '24px',
          width: isExpanded ? '100vw' : '320px',
          height: '48px',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          pointerEvents: isExpanded ? 'none' : 'auto',
          opacity: isExpanded ? 0 : 1,
        }}
      >
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={handleMapClick}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
            </svg>
            <span className="font-semibold text-sm">Trip Map</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (googleMapRef.current) {
                const coords = destinations
                  .filter(d => d.coordinates)
                  .map(d => ({ lat: d.coordinates!.lat, lng: d.coordinates!.lng }));
                if (coords.length > 0) {
                  const bounds = new google.maps.LatLngBounds();
                  coords.forEach(coord => bounds.extend(coord));
                  googleMapRef.current.fitBounds(bounds, { top: 40, bottom: 40, left: 40, right: 40 });
                }
              }
            }}
            className="flex items-center gap-1.5 text-xs bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-md transition-colors duration-200"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Map Container - NO TRANSITION */}
      <div
        className="fixed bg-white overflow-hidden shadow-2xl pointer-events-auto z-50"
        style={{
          top: isExpanded ? 0 : `calc(100vh - ${miniMapHeight + 6}px)`,
          left: isExpanded ? 0 : '24px',
          right: isExpanded ? 0 : undefined,
          bottom: isExpanded ? 0 : undefined,
          width: isExpanded ? '100vw' : '320px',
          height: isExpanded ? '100vh' : `${miniMapHeight}px`,
          borderTopLeftRadius: isExpanded ? '0px' : '0px',
          borderTopRightRadius: isExpanded ? '0px' : '0px',
          borderBottomLeftRadius: isExpanded ? '0px' : '16px',
          borderBottomRightRadius: isExpanded ? '0px' : '16px',
        }}
      >
        {/* Google Map */}
  <div className={`absolute left-0 right-0 top-0 bottom-0`}>
          <GoogleMapView
            destinations={destinations}
            onDestinationClick={onDestinationClick}
            className="w-full h-full"
            onMapReady={(map) => {
              googleMapRef.current = map;
              setIsMapReady(true);
            }}
          />
        </div>

        {/* Click overlay for mini map */}
        {!isExpanded && (
          <div 
            className="absolute inset-0 cursor-pointer group z-20"
            onClick={handleMapClick}
          >
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white bg-opacity-90 rounded-lg px-3 py-2 text-sm font-medium text-gray-800">
                Click to expand
              </div>
            </div>
            {destinations.length > 0 && (
              <div className="absolute top-14 right-3 bg-white bg-opacity-90 rounded-full px-2 py-1 text-xs font-semibold text-gray-700 shadow-sm pointer-events-none">
                {destinations.length} {destinations.length === 1 ? 'stop' : 'stops'}
              </div>
            )}
          </div>
        )}

        {/* Expanded Header */}
        {isExpanded && (
          <div className="absolute top-0 left-0 right-0 bg-white border-b border-gray-200 px-6 py-4" style={{ zIndex: 70 }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                </svg>
                <div>
                  <h2 className="font-bold text-lg text-gray-900">Trip Overview</h2>
                  <p className="text-sm text-gray-600">
                    {destinations.length} {destinations.length === 1 ? 'destination' : 'destinations'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-500">
                  Press <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 rounded">Esc</kbd> to close
                </div>
                <button
                  onClick={handleCloseClick}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Side Panel with Tabs */}
        {isExpanded && onUpdateTrip && (
          <div className="absolute top-20 right-0 bottom-0 w-1/3 bg-white border-l border-gray-200 shadow-xl overflow-hidden" style={{ zIndex: 70 }}>
            <ExpandedMapSidePanel
              trip={trip}
              onUpdateTrip={onUpdateTrip}
              onRemoveDestination={onRemoveDestination}
              onActiveDay={onActiveDay}
              onDestinationMapCenterRequest={onDestinationMapCenterRequest}
              onAddDestination={onAddDestination}
            />
          </div>
        )}

        {/* Bottom Calendar */}
        {isExpanded && (
          <div className="absolute left-0 bottom-0 pb-2" style={{ width: '66.666667%', zIndex: 70 }}>
            <div
              ref={calendarContainerRef}
              className="mx-auto"
              style={{
                paddingLeft: `${SIDE_PADDING}px`,
                paddingRight: `${SIDE_PADDING}px`,
                width: '100%',
                boxSizing: 'border-box',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: 'transparent',
              }}
            >
              <div
                className="relative"
                style={{
                  width: '100%',
                  overflowX: calendarScrollable ? 'auto' : 'visible',
                  WebkitOverflowScrolling: 'touch',
                  display: 'flex',
                  justifyContent: 'center',
                  background: 'transparent',
                }}
              >
                <div
                  ref={calendarInnerRef}
                  style={{
                    transform: `scale(${calendarScale})`,
                    transformOrigin: 'center bottom',
                    transition: 'transform 160ms ease-out',
                    display: 'inline-block',
                    background: 'transparent',
                  }}
                >
                  <CalendarStrip
                    days={trip.days}
                    activeDay={selectedDayIndex !== null && trip.days[selectedDayIndex] ? trip.days[selectedDayIndex].id : ''}
                    onDaySelect={(dayId: string) => {
                      const dayIndex = trip.days.findIndex(d => d.id === dayId);
                      if (dayIndex !== -1) {
                        setSelectedDayIndex(dayIndex);
                        const day = trip.days[dayIndex];
                        if (onDaySelect) onDaySelect(day as Day);
                        if (onActiveDay) onActiveDay(dayId);
                      }
                    }}
                    trip={trip}
                    transparent
                    centered
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
