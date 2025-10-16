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
  const [isMounted, setIsMounted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHidingOverlay, setIsHidingOverlay] = useState(false);
  const [focusedDestinationId, setFocusedDestinationId] = useState<string | null>(null);
  const destinationRefs = useRef<{ [key: string]: HTMLDivElement }>({});
  // Use a single shared map instance
  const sharedMapRef = useRef<mapboxgl.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [shouldResetView, setShouldResetView] = useState(false);
  // Calendar responsiveness: scale down to a min scale and enable scrolling when there's no room
  const calendarContainerRef = useRef<HTMLDivElement | null>(null);
  const calendarInnerRef = useRef<HTMLDivElement | null>(null);
  const [calendarScale, setCalendarScale] = useState<number>(1);
  const [calendarScrollable, setCalendarScrollable] = useState<boolean>(false);
  const MIN_CALENDAR_SCALE = 0.85; // scale floor
  const SIDE_PADDING = 24; // px padding on each side inside the left-2/3 area
  const SCALE_BUFFER = 1.05; // Add 5% buffer to prevent edge-case overflow
  
  // Calculate mini map height to match viewport aspect ratio
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

  // Resize map whenever expansion state changes
  useEffect(() => {
    if (!sharedMapRef.current) return;
    
    // Trigger resize immediately when state changes
    sharedMapRef.current.resize();
    
    // Continue resizing during the transition to keep up with container size changes
    const resizeInterval = setInterval(() => {
      if (sharedMapRef.current) {
        sharedMapRef.current.resize();
      }
    }, 16); // Resize every frame (~60fps) during transition
    
    // Clear interval after transition completes
    const timeout = setTimeout(() => {
      clearInterval(resizeInterval);
      // Final resize to ensure it's perfect
      if (sharedMapRef.current) {
        sharedMapRef.current.resize();
      }
    }, 400);
    
    return () => {
      clearInterval(resizeInterval);
      clearTimeout(timeout);
    };
  }, [isExpanded]);

  // Auto-fit when destinations change (new destination added)
  useEffect(() => {
    if (destinations.length > 0) {
      setShouldResetView(true);
    }
  }, [destinations.length]); // Only trigger when count changes

  // Reset the shouldResetView flag after map has updated
  useEffect(() => {
    if (shouldResetView && isMapLoaded) {
      const timer = setTimeout(() => {
        setShouldResetView(false);
      }, 1000); // Give map time to animate to new bounds
      return () => clearTimeout(timer);
    }
  }, [shouldResetView, isMapLoaded]);

  const openFromMiniMap = () => {
    // When not expanded, the map container is at mini position already
    if (!isExpanded && isMapLoaded && sharedMapRef.current) {
      setIsMounted(true);
      requestAnimationFrame(() => {
        setIsExpanded(true);
        
        // Set padding and trigger reset to realign with new dimensions
        setTimeout(() => {
          if (sharedMapRef.current) {
            // Set padding to account for right panel (1/3 of screen)
            const rightPadding = window.innerWidth / 3;
            sharedMapRef.current.setPadding({ 
              top: 80, 
              bottom: 120, 
              left: 20, 
              right: rightPadding 
            });
          }
          // Trigger reset to fit bounds with new padding
          setShouldResetView(true);
        }, 400);
      });
    }
  };

  const handleMapClick = () => {
    openFromMiniMap();
  };

  const handleResetPosition = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShouldResetView(true);
  };

  const handleCloseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Remove padding and trigger reset to realign
    if (sharedMapRef.current) {
      sharedMapRef.current.setPadding({ top: 0, bottom: 0, left: 0, right: 0 });
    }
    setShouldResetView(true);
    
    setIsExpanded(false);
    
    // Wait for animation to complete before unmounting
    setTimeout(() => {
      setIsMounted(false);
    }, 400);
  };

  return (
    <>
      {/* Backdrop - only visible when expanded */}
      {isMounted && isExpanded && (
        <div 
          aria-hidden
          onClick={handleCloseClick}
          className="fixed inset-0 bg-black"
          style={{ 
            opacity: 0.4, 
            pointerEvents: 'auto',
            zIndex: 45
          }}
        />
      )}

      {/* Mini Map Header - positioned above the map container and animates with it */}
      <div 
        className="fixed bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg"
        style={{
          top: isExpanded ? '-48px' : `calc(100vh - ${miniMapHeight + 54}px)`,
          left: isExpanded ? 0 : '24px',
          width: isExpanded ? '100vw' : '320px',
          height: '48px',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          zIndex: 50,
          transition: isMounted ? 'all 360ms cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none',
          willChange: isMounted ? 'top, left, width' : 'auto',
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
            onClick={handleResetPosition}
            className="flex items-center gap-1.5 text-xs bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-md transition-colors duration-200"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Single Map Container - moves between mini and expanded positions */}
      <div
        className="fixed bg-white overflow-hidden shadow-2xl pointer-events-auto"
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
          transition: isMounted ? 'all 360ms cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none',
          zIndex: 50,
          willChange: isMounted ? 'top, left, width, height, border-radius' : 'auto',
        }}
      >
        {/* Map - renders once, stays mounted */}
        <div className="absolute left-0 right-0 bottom-0 top-0">
          <SimpleMap 
            destinations={destinations}
            focusedDestination={isExpanded ? destinations.find(d => d.id === focusedDestinationId) ?? null : null}
            onDestinationClick={onDestinationClick}
            className="w-full h-full"
            centerOn={centerOn}
            onCentered={onCentered}
            fitBoundsPadding={{ top: 50, bottom: 40, left: 40, right: 40 }}
            maxZoom={7}
            onMapReady={(map) => { 
              sharedMapRef.current = map;
              // Check if map is already loaded, or wait for it to load
              if (map.loaded()) {
                setIsMapLoaded(true);
              } else {
                map.once('load', () => {
                  setIsMapLoaded(true);
                });
              }
            }}
            disableAutoFit={!shouldResetView}
            animateFitBounds={shouldResetView}
            forceRefreshKey={shouldResetView ? Date.now() : undefined}
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

        {/* Expanded Header - overlays on top of map */}
        {isExpanded && (
          <div className="absolute top-0 left-0 right-0 z-60 bg-white border-b border-gray-200 px-6 py-4">
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

        {/* Side Panel - only visible when expanded */}
        {isExpanded && (
          <>
            {/* Side Panel */}
            <div className="absolute top-20 right-0 bottom-0 w-1/3 bg-white border-l border-gray-200 shadow-xl overflow-hidden flex flex-col z-60">
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
                  <button className="w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors duration-200 text-sm" onClick={() => alert('Use timeline to add activities')}>
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

            {/* Bottom Calendar */}
            <div className="absolute left-0 bottom-0 z-60 pb-2" style={{ width: '66.666667%' }}>
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
          </>
        )}
      </div>
    </>
  );
}

