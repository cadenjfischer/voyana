'use client';

import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import SimpleMap from '@/components/map/SimpleMap';
import CalendarStrip from '@/components/itinerary/CalendarStrip';
import TimelineView from '@/components/itinerary/TimelineView';
import CompactEditor from './CompactEditor';
import { Destination, Day, Activity } from '@/types/itinerary';
import { resolveColorHex } from '@/utils/colors';

interface ExpandableMapWidgetProps {
  trip: import('@/types/itinerary').Trip;
  destinations: Destination[];
  selectedDay?: Day | null;
  onDestinationClick?: (destination: Destination) => void;
  onActivityClick?: (activity: Activity) => void;
  centerOn?: { lat: number; lng: number } | null;
  onCentered?: () => void;
  onDaySelect?: (day: Day) => void;
  // Editing hooks when map is expanded
  onUpdateDestination?: (destination: Destination) => void;
  onRemoveDestination?: (destinationId: string) => void;
  onAddDestination?: (destination: Omit<Destination, 'id' | 'order'>) => void;
  onDaysUpdate?: (days: Day[]) => void;
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
  onDaysUpdate
}: ExpandableMapWidgetProps) {
  const miniMapWrapperRef = useRef<HTMLDivElement | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [overlayRect, setOverlayRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [focusedDestinationId, setFocusedDestinationId] = useState<string | null>(null);
  const [miniMapKey, setMiniMapKey] = useState(0);
  const destinationRefs = useRef<{ [key: string]: HTMLDivElement }>({});
  // Store mini map instance and viewport state
  const miniMapRef = useRef<mapboxgl.Map | null>(null);
  const [capturedViewport, setCapturedViewport] = useState<{ center: [number, number]; zoom: number } | null>(null);
  // Calendar responsiveness: scale down to a min scale and enable scrolling when there's no room
  const calendarContainerRef = useRef<HTMLDivElement | null>(null);
  const calendarInnerRef = useRef<HTMLDivElement | null>(null);
  const [calendarScale, setCalendarScale] = useState<number>(1);
  const [calendarScrollable, setCalendarScrollable] = useState<boolean>(false);
  const MIN_CALENDAR_SCALE = 0.85; // scale floor
  const SIDE_PADDING = 24; // px padding on each side inside the left-2/3 area
  const SCALE_BUFFER = 1.05; // Add 5% buffer to prevent edge-case overflow

  useEffect(() => {
    const container = calendarContainerRef.current;
    const inner = calendarInnerRef.current;
    if (!container || !inner) return;

    const updateScale = () => {
      const containerRect = container.getBoundingClientRect();
      const innerRect = inner.getBoundingClientRect();
      
      // Get the actual natural width of the calendar content
      const naturalWidth = innerRect.width / (calendarScale || 1); // Reverse current scale to get true width
      const available = containerRect.width - SIDE_PADDING * 2;
      
      // desired scale to fit the natural calendar width into available space with buffer
      const desired = Math.min(1, (available / naturalWidth) / SCALE_BUFFER);
      const scale = Math.max(desired, MIN_CALENDAR_SCALE);
      
      setCalendarScale(scale);
      // if desired is smaller than the min scale, we need to allow scrolling
      setCalendarScrollable(desired < MIN_CALENDAR_SCALE);
    };

    const ro = new ResizeObserver(() => {
      updateScale();
    });

    ro.observe(container);
    // Also observe the inner content in case it changes
    ro.observe(inner);
    
    // Initial update
    requestAnimationFrame(updateScale);

    return () => ro.disconnect();
  }, [isMounted, isExpanded, calendarScale]);  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Toggle map with 'M' key
      if (event.key === 'm' || event.key === 'M') {
        if (!event.ctrlKey && !event.metaKey && !event.altKey) {
          const target = event.target as HTMLElement;
          // Don't trigger if user is typing in an input or textarea
          if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
            event.preventDefault();
            if (!isMounted) {
              openFromMiniMap();
            } else {
              handleCloseClick(event as any);
            }
          }
        }
      }

      // Close map with Escape
      if (event.key === 'Escape' && isMounted) {
        event.preventDefault();
        handleCloseClick(event as any);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMounted, isExpanded]);

  // Default focused destination to the top of the list whenever destinations change
  useEffect(() => {
    if (destinations && destinations.length > 0) {
      setFocusedDestinationId(destinations[0].id);
    } else {
      setFocusedDestinationId(null);
    }
  }, [destinations]);

  const measureMiniMap = () => {
    if (miniMapWrapperRef.current) {
      const rect = miniMapWrapperRef.current.getBoundingClientRect();
      return {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      };
    }
    return null;
  };

  const openFromMiniMap = () => {
    const rect = measureMiniMap();
    if (rect) {
      // Capture the current viewport from the mini map
      if (miniMapRef.current) {
        const center = miniMapRef.current.getCenter();
        const zoom = miniMapRef.current.getZoom();
        setCapturedViewport({ center: [center.lng, center.lat], zoom });
      }
      setOverlayRect(rect);
      setIsMounted(true);
      requestAnimationFrame(() => {
        setIsExpanded(true);
      });
    }
  };

  const handleMapClick = () => {
    openFromMiniMap();
  };

  const handleCloseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(false);
  };

  return (
    <>
      {/* Mini Map Widget - always visible at bottom-left */}
      <div 
        ref={miniMapWrapperRef}
        className="fixed bottom-6 left-6 z-40 cursor-pointer group hover:shadow-3xl hover:-translate-y-1 transition-all duration-200"
        style={{ width: '320px', height: '200px' }}
        onClick={handleMapClick}
      >
        <div className="rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden h-full">
          {/* Widget Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                </svg>
                <span className="font-semibold text-sm">Trip Map</span>
              </div>
              <div className="text-xs opacity-90">
                Press M to expand
              </div>
            </div>
          </div>

          {/* Map Container */}
          <div className="relative" style={{ height: '152px' }}>
            <SimpleMap 
              destinations={destinations}
              onDestinationClick={onDestinationClick}
              className="w-full h-full"
              centerOn={centerOn}
              onCentered={onCentered}
              fitBoundsPadding={{ top: 55, bottom: 60, left: 10, right: 10 }}
              onMapReady={(map) => { miniMapRef.current = map; }}
            />
            
            {/* Loading indicator for map */}
            {destinations.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-xs text-gray-500">Add destinations to see map</p>
                </div>
              </div>
            )}
            
            {/* Overlay with expand hint */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white bg-opacity-90 rounded-lg px-3 py-2 text-sm font-medium text-gray-800">
                Click to expand
              </div>
            </div>

            {/* Destination count badge */}
            {destinations.length > 0 && (
              <div className="absolute top-3 right-3 bg-white bg-opacity-90 rounded-full px-2 py-1 text-xs font-semibold text-gray-700 shadow-sm">
                {destinations.length} {destinations.length === 1 ? 'stop' : 'stops'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Overlay - morphs from mini map position */}
      {isMounted && overlayRect && (
        <>
          {/* Backdrop with dimming */}
          <div 
            aria-hidden
            onClick={handleCloseClick}
            className="fixed inset-0 bg-black transition-opacity duration-300 z-40"
            style={{ opacity: isExpanded ? 0.4 : 0 }}
          />

          {/* Animated container that morphs from mini map to full screen */}
          <div 
            className="fixed z-50 pointer-events-none bg-white rounded-2xl overflow-hidden shadow-2xl"
            style={{
              top: isExpanded ? 0 : overlayRect.top,
              left: isExpanded ? 0 : overlayRect.left,
              width: isExpanded ? '100vw' : overlayRect.width,
              height: isExpanded ? '100vh' : overlayRect.height,
              transition: 'all 360ms cubic-bezier(0.2, 0.8, 0.2, 1)',
              borderRadius: isExpanded ? '0px' : '16px',
              transformOrigin: isExpanded 
                ? `${overlayRect.left + overlayRect.width / 2}px ${overlayRect.top + overlayRect.height / 2}px`
                : 'center center',
            }}
            onTransitionEnd={() => {
              // When close animation finishes, unmount the overlay
              if (!isExpanded) {
                setIsMounted(false);
                setOverlayRect(null);
                // Force mini-map to remount to ensure it re-renders properly
                setMiniMapKey(prev => prev + 1);
              }
            }}
          >
            <div className="w-full h-full pointer-events-auto">{/* Content wrapper */}
              {/* Header */}
              <div className="absolute top-0 left-0 right-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                    </svg>
                    <div>
                      <h2 className="font-bold text-lg text-gray-900">Trip Overview</h2>
                      <p className="text-sm text-gray-600">
                        {destinations.length} {destinations.length === 1 ? 'destination' : 'destinations'}
                        {selectedDay && (
                          <span className="ml-2 text-blue-600">
                            • {new Date(selectedDay.date).toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric' 
                            })} selected
                          </span>
                        )}
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

              {/* Main Content */}
              <div className="absolute inset-0 pt-20 flex">
                {/* Map Section (2/3 width) */}
                <div className="w-2/3 h-full relative" style={{ opacity: isExpanded ? 1 : 0, transition: 'opacity 200ms ease-in 200ms' }}>
                  <SimpleMap 
                    key="expanded-map"
                    destinations={destinations}
                    focusedDestination={destinations.find(d => d.id === focusedDestinationId) ?? null}
                    onDestinationClick={onDestinationClick}
                    className="w-full h-full"
                    centerOn={centerOn}
                    onCentered={onCentered}
                    disableAutoFit={true}
                    animateFitBounds={false}
                    initialCenter={capturedViewport?.center}
                    initialZoom={capturedViewport?.zoom}
                  />
                </div>

                {/* Side Panel (1/3 width) */}
                <div className="w-1/3 h-full bg-white border-l border-gray-200 shadow-xl overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-2">Quick Actions</h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => onAddDestination && onAddDestination({ name: 'New Destination', nights: 0, lodging: '', estimatedCost: 0, startDate: trip.startDate, endDate: trip.endDate })}
                        className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200 text-sm"
                      >
                        <div className="font-medium text-blue-900">Add Destination</div>
                        <div className="text-blue-700 text-xs">Plan your next stop</div>
                      </button>
                      <button className="w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors duration-200 text-sm" onClick={() => alert('Use timeline to add activities while map is open')}>
                        <div className="font-medium text-green-900">Add Activity</div>
                        <div className="text-green-700 text-xs">Plan what to do</div>
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-hidden">
                    <CompactEditor
                      trip={trip}
                      destinations={destinations}
                      selectedDay={selectedDay}
                      onUpdateDestination={(d) => onUpdateDestination && onUpdateDestination(d)}
                      onRemoveDestination={(id) => onRemoveDestination && onRemoveDestination(id)}
                      onAddDestination={(d) => onAddDestination && onAddDestination(d)}
                      onDestinationClick={(d) => onDestinationClick && onDestinationClick(d)}
                    />
                  </div>

                  {/* Day-by-day activity view */}
                  <div className="h-1/3 border-t border-gray-100 overflow-auto">
                    <TimelineView
                      trip={trip}
                      activeDestinationId={focusedDestinationId ?? ''}
                      activeDay={selectedDay ? selectedDay.id : ''}
                      destinationRefs={destinationRefs}
                      onDaysUpdate={(updatedDays) => {
                        if (onDaysUpdate) onDaysUpdate(updatedDays);
                      }}
                      onDaySelect={(dayId) => {
                        const day = trip.days.find(d => d.id === dayId);
                        if (day && onDaySelect) onDaySelect(day);
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Calendar Strip - only spans left 2/3 of screen */}
              <div className="absolute left-0 bottom-0 z-50 pb-4" style={{ width: '66.666667%' }}>
                {/* Outer container provides side padding and centers content horizontally inside left 2/3 */}
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
                  }}
                >
                  {/* Inner wrapper applies scaling and optional horizontal scroll */}
                  <div
                    className="relative"
                    style={{
                      width: '100%',
                      overflowX: calendarScrollable ? 'auto' : 'visible',
                      WebkitOverflowScrolling: 'touch',
                      display: 'flex',
                      justifyContent: 'center'
                    }}
                  >
                    <div
                      ref={calendarInnerRef}
                      style={{
                        transform: `scale(${calendarScale})`,
                        transformOrigin: 'center bottom',
                        transition: 'transform 160ms ease-out',
                        display: 'inline-block'
                      }}
                    >
                      <CalendarStrip
                        days={trip.days}
                        activeDay={selectedDay ? selectedDay.id : ''}
                        onDaySelect={(dayId: string) => onDaySelect && onDaySelect(trip.days.find(d => d.id === dayId) as Day)}
                        trip={trip}
                        transparent
                        centered
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>{/* Close content wrapper */}
          </div>{/* Close animated container */}
        </>
      )}
    </>
  );
}

