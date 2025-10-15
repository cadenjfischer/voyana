'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  onAddDestination
  , onDaysUpdate
}: ExpandableMapWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [focusedDestinationId, setFocusedDestinationId] = useState<string | null>(null);
  const [miniMapKey, setMiniMapKey] = useState(0);
  const destinationRefs = useRef<{ [key: string]: HTMLDivElement }>({});

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Toggle map with 'M' key
      if (event.key === 'm' || event.key === 'M') {
        if (!event.ctrlKey && !event.metaKey && !event.altKey) {
          const target = event.target as HTMLElement;
          // Don't trigger if user is typing in an input or textarea
          if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
            event.preventDefault();
            setIsExpanded(prev => !prev);
          }
        }
      }

      // Close map with Escape
      if (event.key === 'Escape' && isExpanded) {
        event.preventDefault();
        setIsExpanded(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  // Default focused destination to the top of the list whenever destinations change
  useEffect(() => {
    if (destinations && destinations.length > 0) {
      setFocusedDestinationId(destinations[0].id);
    } else {
      setFocusedDestinationId(null);
    }
  }, [destinations]);

  // Map will automatically update when destinations prop changes

  const handleMapClick = () => {
    if (!isExpanded) {
      setIsExpanded(true);
    }
  };

  const handleCloseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(false);
  };

  // Remount mini-map when shown to ensure proper rendering
  useEffect(() => {
    if (!isExpanded) {
      // Give a moment for the mini-map container to be fully rendered
      const timer = setTimeout(() => {
        setMiniMapKey(prev => prev + 1);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  return (
    <>
      {/* Mini Map Widget - Bottom Left */}
      {!isExpanded && (
        <div 
          className="fixed bottom-6 left-6 z-40 cursor-pointer group"
          onClick={handleMapClick}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transition-all duration-300 group-hover:shadow-3xl group-hover:-translate-y-1">
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

            {/* Mini Map Container - 16:10 aspect ratio */}
            <div className="relative" style={{ width: '320px', height: '200px', background: 'transparent' }}>
              <SimpleMap 
                key={miniMapKey}
                destinations={destinations}
                onDestinationClick={onDestinationClick}
                className="w-full h-full"
                centerOn={centerOn}
                onCentered={onCentered}
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
      )}

      {/* Expanded Map - Full Screen Overlay */}
      {isExpanded && (
        <div className="fixed inset-0 z-50" style={{ background: 'transparent' }}>
          {/* Map Header */}
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

          {/* Main content: Map (2/3) and Side Panel (1/3) */}
          <div className="absolute inset-0 pt-20 flex">
            <div className="w-2/3 h-full">
              <SimpleMap
                destinations={destinations}
                focusedDestination={destinations.find(d => d.id === focusedDestinationId) ?? null}
                onDestinationClick={onDestinationClick}
                className="w-full h-full"
                centerOn={centerOn}
                onCentered={onCentered}
              />
            </div>

            <div className="w-1/3 h-full bg-white border-l border-gray-200 shadow-xl overflow-hidden flex flex-col z-50">
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

            {/* Right panel header area */}
            <div className="p-3 border-b border-gray-100">
              {/* Quick actions header sits above; nothing else here now */}
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

              {/* Day-by-day activity view (moved here into right 1/3 panel) */}
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

          {/* Bottom Calendar Strip full-width */}
          <div className="absolute left-0 bottom-0 h-36 z-50 pointer-events-none w-full">
            <div className="w-full px-6 py-3 flex justify-center">
              {/* Left 2/3: calendar strip (transparent background) - left aligned to map area */}
              <div className="w-2/3 pointer-events-auto px-4 flex justify-center">
                <CalendarStrip
                  days={trip.days}
                  activeDay={selectedDay ? selectedDay.id : ''}
                  onDaySelect={(dayId: string) => onDaySelect && onDaySelect(trip.days.find(d => d.id === dayId) as Day)}
                  trip={trip}
                  transparent
                  centered
                />
              </div>

              {/* Right 1/3 remains empty to prevent overlap */}
              <div className="w-1/3" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

