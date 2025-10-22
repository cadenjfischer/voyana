'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Trip, Destination, Day, Activity, ACTIVITY_TYPES, formatDate, formatCurrency } from '@/types/itinerary';
import { getDestinationColors, isTransferDay } from '@/utils/colors';

interface TimelineViewProps {
  trip: Trip;
  activeDestinationId: string;
  activeDay: string;
  destinationRefs: React.MutableRefObject<{ [key: string]: HTMLDivElement }>;
  onDaysUpdate: (days: Day[]) => void;
  onDaySelect?: (dayId: string) => void;
}

export default function TimelineView({
  trip,
  activeDestinationId,
  activeDay,
  destinationRefs,
  onDaysUpdate,
  onDaySelect
}: TimelineViewProps) {
  // View mode toggle
  const [viewMode, setViewMode] = useState<'day' | 'timeline'>('day');

  // Load view mode from localStorage on mount
  useEffect(() => {
    const savedViewMode = localStorage.getItem('dayByDayViewMode');
    if (savedViewMode === 'day' || savedViewMode === 'timeline') {
      setViewMode(savedViewMode);
    }
  }, []);

  // Save view mode to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('dayByDayViewMode', viewMode);
  }, [viewMode]);

  // Track which days are collapsed (default: all collapsed)
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(
    new Set(trip.days.map(d => d.id))
  );

  // Toggle a single day
  const toggleDay = (dayId: string) => {
    setCollapsedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dayId)) {
        newSet.delete(dayId);
      } else {
        newSet.add(dayId);
      }
      return newSet;
    });
  };

  // Toggle all days
  const toggleAll = () => {
    if (collapsedDays.size === trip.days.length) {
      // All collapsed, expand all
      setCollapsedDays(new Set());
    } else {
      // Some or none collapsed, collapse all
      setCollapsedDays(new Set(trip.days.map(d => d.id)));
    }
  };

  const allCollapsed = collapsedDays.size === trip.days.length;



  // Handle activity drag and drop
  const handleActivityDragEnd = useCallback((result: DropResult) => {
    // Early returns for invalid operations
    if (!result.destination) return;
    if (result.destination.index === result.source.index && 
        result.destination.droppableId === result.source.droppableId) return;

    const sourceDay = trip.days.find(day => day.id === result.source.droppableId);
    const destDay = trip.days.find(day => day.id === result.destination!.droppableId);
    
    if (!sourceDay || !destDay) return;
    if (result.source.index >= sourceDay.activities.length) return;

    try {
      let updatedDays = [...trip.days];

      if (sourceDay.id === destDay.id) {
        // Reordering within same day
        const activities = Array.from(sourceDay.activities);
        const [reorderedActivity] = activities.splice(result.source.index, 1);
        activities.splice(result.destination.index, 0, reorderedActivity);

        const updatedActivities = activities.map((activity, index) => ({
          ...activity,
          order: index
        }));

        updatedDays = updatedDays.map(day =>
          day.id === sourceDay.id
            ? { 
                ...day, 
                activities: updatedActivities,
                totalCost: updatedActivities.reduce((sum, act) => sum + act.cost, 0)
              }
            : day
        );
      } else {
        // Moving between days
        const sourceActivities = Array.from(sourceDay.activities);
        const [movedActivity] = sourceActivities.splice(result.source.index, 1);
        
        const destActivities = Array.from(destDay.activities);
        destActivities.splice(result.destination.index, 0, {
          ...movedActivity,
          dayId: destDay.id
        });

        // Update source day
        const updatedSourceActivities = sourceActivities.map((activity, index) => ({
          ...activity,
          order: index
        }));

        // Update destination day
        const updatedDestActivities = destActivities.map((activity, index) => ({
          ...activity,
          order: index
        }));

        updatedDays = updatedDays.map(day => {
          if (day.id === sourceDay.id) {
            return {
              ...day,
              activities: updatedSourceActivities,
              totalCost: updatedSourceActivities.reduce((sum, act) => sum + act.cost, 0)
            };
          } else if (day.id === destDay.id) {
            return {
              ...day,
              activities: updatedDestActivities,
              totalCost: updatedDestActivities.reduce((sum, act) => sum + act.cost, 0)
            };
          }
          return day;
        });
      }

      onDaysUpdate(updatedDays);
    } catch (error) {
      console.error('Error updating activities during drag and drop:', error);
    }
  }, [trip.days, onDaysUpdate]);

  // Get activity icon
  const getActivityIcon = (activity: Activity) => {
    const config = ACTIVITY_TYPES[activity.type];
    if (!config) return '📝';
    return activity.icon || config.icon;
  };

  // Group days by destination and handle unassigned days
  const groupedDays = trip.days.reduce((acc, day) => {
    if (day.destinationId) {
      const destination = trip.destinations.find(d => d.id === day.destinationId);
      if (destination) {
        if (!acc[destination.id]) {
          acc[destination.id] = { destination, days: [] };
        }
        acc[destination.id].days.push(day);
      }
    } else {
      // Handle unassigned days
      if (!acc['unassigned']) {
        acc['unassigned'] = { destination: null, days: [] };
      }
      acc['unassigned'].days.push(day);
    }
    return acc;
  }, {} as { [key: string]: { destination: Destination | null; days: Day[] } });

  return (
    <div className="px-6 py-4 pb-[800px] space-y-6">
      {/* Header with View Toggle and Expand/Collapse */}
      <div className="flex justify-between items-center">
        {/* View Mode Toggle */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('day')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              viewMode === 'day'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>🗓️</span>
            Day View
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              viewMode === 'timeline'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>📜</span>
            Timeline
          </button>
        </div>

        {/* Expand/Collapse All Button (only show in Day View) */}
        {viewMode === 'day' && (
          <button
            onClick={toggleAll}
            className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors duration-200 flex items-center gap-1.5"
          >
            {allCollapsed ? (
              <>
                Expand All
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </>
            ) : (
              <>
                Collapse All
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </>
            )}
          </button>
        )}
      </div>

      {/* Day View (Planning Mode) */}
      {viewMode === 'day' && (
        <DragDropContext onDragEnd={handleActivityDragEnd}>
        {Object.entries(groupedDays).map(([destinationId, { destination, days }]) => {
          const colors = getDestinationColors(destinationId, trip.destinations, true);
          
          return (
            <div key={destinationId} className="space-y-6">
              {/* Days */}
              <div className="space-y-6">
                {days.map((day, dayIndex) => {
                  const isActiveDay = day.id === activeDay;
                  const dayIndexInTrip = trip.days.findIndex(d => d.id === day.id);
                  const isTransfer = isTransferDay(dayIndexInTrip, trip.days, trip.destinations);
                  const isCollapsed = collapsedDays.has(day.id);
                  
                  return (
                    <div
                      key={day.id}
                      ref={(el) => {
                        if (el) destinationRefs.current[day.id] = el;
                      }}
                      className={`bg-white ${isCollapsed ? 'rounded-xl' : 'rounded-xl'} border-2 transition-all duration-300 ${
                        isActiveDay 
                          ? 'border-blue-500 shadow-xl ring-4 ring-blue-100' 
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                      }`}
                    >
                      {/* Day Header */}
                      <div
                        className={`w-full text-left transition-all duration-200 ${
                          onDaySelect 
                            ? 'hover:brightness-95 cursor-pointer' 
                            : 'cursor-default'
                        }`}
                        onClick={() => {
                          if (onDaySelect) onDaySelect(day.id);
                        }}
                      >
                        <div 
                          className={`border-b border-gray-100 p-4 ${isCollapsed ? 'rounded-xl' : 'rounded-t-xl'}`}
                          style={(() => {
                            // Check if this day should be treated as unassigned due to nights allocation
                            if (destination && day.destinationId) {
                              // Count how many days are assigned to this destination up to this point
                              const daysAssignedToThisDestination = trip.days.slice(0, dayIndexInTrip + 1).filter(d => d.destinationId === day.destinationId).length;
                              
                              // If this day exceeds the allocated nights + 1 (for departure day), treat as unassigned
                              // You get (nights + 1) days in a destination because you wake up there on the departure day
                              if (destination.nights === 0 || daysAssignedToThisDestination > destination.nights + 1) {
                                return { backgroundColor: '#f9fafb' }; // light gray for unassigned
                              }
                            }
                            
                            // Convert Tailwind colors to actual hex values for inline styles
                            const getColorHex = (bgClass: string) => {
                              const colorMap: { [key: string]: string } = {
                                'bg-sky-500': '#0ea5e9',
                                'bg-green-500': '#22c55e', 
                                'bg-purple-500': '#a855f7',
                                'bg-orange-500': '#f97316',
                                'bg-pink-500': '#ec4899',
                                'bg-indigo-500': '#6366f1',
                                'bg-red-500': '#ef4444',
                                'bg-teal-500': '#14b8a6',
                                'bg-yellow-500': '#eab308',
                                'bg-red-800': '#991b1b',
                                'bg-yellow-600': '#ca8a04',
                                'bg-slate-800': '#1e293b',
                                'bg-emerald-500': '#10b981',
                                'bg-orange-600': '#ff6b35',
                                'bg-cyan-500': '#06b6d4',
                                'bg-fuchsia-500': '#d946ef'
                              };
                              return colorMap[bgClass] || '#f97316';
                            };
                            
                            if (isTransfer) {
                              const prevDayIndex = dayIndexInTrip - 1;
                              const prevDay = prevDayIndex >= 0 ? trip.days[prevDayIndex] : null;
                              const prevDestination = prevDay?.destinationId 
                                ? trip.destinations.find(d => d.id === prevDay.destinationId)
                                : null;
                              
                              if (prevDestination && destination) {
                                // Get calendar background colors (slightly darker for better contrast)
                                const getCalendarBgHex = (destId: string) => {
                                  const dest = trip.destinations.find(d => d.id === destId);
                                  if (dest?.customColor) {
                                    const colorMap: { [key: string]: string } = {
                                      'ocean-blue': '#bae6fd',
                                      'tropical-green': '#bbf7d0', 
                                      'sunset-purple': '#e9d5ff',
                                      'adventure-orange': '#fed7aa',
                                      'cherry-pink': '#f9a8d4',
                                      'deep-indigo': '#c7d2fe',
                                      'ruby-red': '#fecaca',
                                      'emerald-teal': '#99f6e4',
                                      'golden-yellow': '#fde047',
                                      'wine-burgundy': '#fca5a5',
                                      'bronze-gold': '#facc15',
                                      'navy-midnight': '#cbd5e1',
                                      'mint-fresh': '#a7f3d0',
                                      'sunset-coral': '#fdba74',
                                      'arctic-cyan': '#a5f3fc',
                                      'magenta-fuchsia': '#e879f9'
                                    };
                                    return colorMap[dest.customColor] || '#f9fafb';
                                  }
                                  // Fallback to hash-based selection for calendar colors
                                  const generateHash = (str: string) => {
                                    let hash = 0;
                                    for (let i = 0; i < str.length; i++) {
                                      const char = str.charCodeAt(i);
                                      hash = ((hash << 5) - hash) + char;
                                      hash = hash & hash;
                                    }
                                    return Math.abs(hash);
                                  };
                                  const calendarBgs = ['#bae6fd', '#bbf7d0', '#e9d5ff', '#fed7aa', '#f9a8d4', '#c7d2fe', '#fecaca', '#99f6e4', '#fde047', '#fca5a5', '#facc15', '#cbd5e1', '#a7f3d0', '#fdba74', '#a5f3fc', '#e879f9'];
                                  const hash = generateHash(destId);
                                  return calendarBgs[hash % calendarBgs.length];
                                };
                                
                                const prevBg = getCalendarBgHex(prevDestination.id);
                                const currentBg = getCalendarBgHex(destination.id);
                                const gradient = `linear-gradient(to right, ${prevBg}, ${currentBg})`;
                                return {
                                  background: gradient
                                };
                              } else {
                                return { backgroundColor: '#fed7aa' }; // orange-200
                              }
                            } else {
                              // Regular days - use the darker calendar background colors for better contrast
                              if (destination) {
                                const getCalendarBgHex = (destId: string) => {
                                  const dest = trip.destinations.find(d => d.id === destId);
                                  if (dest?.customColor) {
                                    const colorMap: { [key: string]: string } = {
                                      'ocean-blue': '#bae6fd',
                                      'tropical-green': '#bbf7d0', 
                                      'sunset-purple': '#e9d5ff',
                                      'adventure-orange': '#fed7aa',
                                      'cherry-pink': '#f9a8d4',
                                      'deep-indigo': '#c7d2fe',
                                      'ruby-red': '#fecaca',
                                      'emerald-teal': '#99f6e4',
                                      'golden-yellow': '#fde047',
                                      'wine-burgundy': '#fca5a5',
                                      'bronze-gold': '#facc15',
                                      'navy-midnight': '#cbd5e1',
                                      'mint-fresh': '#a7f3d0',
                                      'sunset-coral': '#fdba74',
                                      'arctic-cyan': '#a5f3fc',
                                      'magenta-fuchsia': '#e879f9'
                                    };
                                    return colorMap[dest.customColor] || '#f9fafb';
                                  }
                                  // Fallback to hash-based selection for calendar colors
                                  const generateHash = (str: string) => {
                                    let hash = 0;
                                    for (let i = 0; i < str.length; i++) {
                                      const char = str.charCodeAt(i);
                                      hash = ((hash << 5) - hash) + char;
                                      hash = hash & hash;
                                    }
                                    return Math.abs(hash);
                                  };
                                  const calendarBgs = ['#bae6fd', '#bbf7d0', '#e9d5ff', '#fed7aa', '#f9a8d4', '#c7d2fe', '#fecaca', '#99f6e4', '#fde047', '#fca5a5', '#facc15', '#cbd5e1', '#a7f3d0', '#fdba74', '#a5f3fc', '#e879f9'];
                                  const hash = generateHash(destId);
                                  return calendarBgs[hash % calendarBgs.length];
                                };
                                
                                return {
                                  backgroundColor: getCalendarBgHex(destination.id)
                                };
                              } else {
                                return { backgroundColor: '#f9fafb' }; // light gray for unassigned days
                              }
                            }
                          })()}
                        >
                          <div className="grid grid-cols-3 items-center">
                            {/* Left: Day Info */}
                            <div className="flex items-center gap-3">
                              <div className="flex items-center">
                                <div className={`w-3 h-3 rounded-full ${colors.bg} ${isActiveDay ? 'animate-pulse' : ''}`} />
                                {isTransfer && (
                                  <div className="ml-1 w-3 h-3 bg-orange-500 rounded-full flex items-center justify-center">
                                    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                              <div>
                                <h3 className={`font-semibold ${isActiveDay ? 'text-blue-900' : 'text-gray-900'}`}>
                                  Day {dayIndexInTrip + 1} • {formatDate(day.date)}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                  {day.activities.length} activities • {formatCurrency(day.totalCost)}
                                  {!destination && (
                                    <span className="ml-2 text-orange-600">• Unassigned</span>
                                  )}
                                </p>
                              </div>
                            </div>

                          {/* Center: Destination */}
                          <div className="text-center">
                            {isTransfer ? (
                              <div className="flex items-center justify-center gap-2">
                                <span className="text-sm text-orange-600 font-medium">Transfer Day</span>
                                <div className="flex items-center gap-1">
                                  {(() => {
                                    const prevDayIndex = dayIndexInTrip - 1;
                                    const prevDay = prevDayIndex >= 0 ? trip.days[prevDayIndex] : null;
                                    const prevDestination = prevDay?.destinationId 
                                      ? trip.destinations.find(d => d.id === prevDay.destinationId)
                                      : null;
                                    
                                    return (
                                      <>
                                        <span className="text-xs text-gray-600">
                                          {prevDestination?.name || 'Unknown'}
                                        </span>
                                        <svg className="w-3 h-3 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-xs text-gray-600">
                                          {destination?.name || 'Unknown'}
                                        </span>
                                      </>
                                    );
                                  })()}
                                </div>
                              </div>
                            ) : destination ? (
                              <p className="text-base font-medium text-gray-700">
                                {destination.name}
                              </p>
                            ) : null}
                          </div>
                          
                          {/* Right: Add Button */}
                          <div className="flex items-center justify-end gap-2">
                            {/* Add Activity Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDaySelect?.(day.id);
                              }}
                              className={`px-3 py-1.5 text-sm font-medium ${colors.text} hover:bg-white rounded-lg transition-colors duration-200`}
                            >
                              + Add
                            </button>
                            
                            {/* Collapse Toggle */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleDay(day.id);
                              }}
                              className="p-1.5 hover:bg-white/50 rounded transition-colors duration-200"
                            >
                              {isCollapsed ? (
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                      </div>

                      {/* Activities - only show when not collapsed */}
                      {!isCollapsed && (
                        <>
                          <Droppable droppableId={day.id}>
                        {(provided, snapshot) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className={`p-4 min-h-[120px] transition-all duration-200 ${
                              snapshot.isDraggingOver 
                                ? 'bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg' 
                                : ''
                            }`}
                          >
                            {day.activities.length > 0 ? (
                              <div className="space-y-3">
                                {day.activities.map((activity, activityIndex) => (
                                  <Draggable
                                    key={activity.id}
                                    draggableId={activity.id}
                                    index={activityIndex}
                                  >
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className={`bg-white border border-gray-200 rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all duration-200 ${
                                          snapshot.isDragging 
                                            ? 'rotate-2 scale-105 shadow-2xl border-blue-300 bg-blue-50 z-50' 
                                            : 'hover:shadow-md hover:border-gray-300'
                                        }`}
                                      >
                                        <div className="flex items-start gap-3">
                                          {/* Activity Icon */}
                                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm flex-shrink-0">
                                            {getActivityIcon(activity)}
                                          </div>
                                          
                                          {/* Activity Content */}
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between">
                                              <div className="flex-1">
                                                <h4 className="font-medium text-gray-900 text-sm">
                                                  {activity.title}
                                                </h4>
                                                {activity.description && (
                                                  <p className="text-xs text-gray-600 mt-1">
                                                    {activity.description}
                                                  </p>
                                                )}
                                                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                                  {activity.time && (
                                                    <span>{activity.time}</span>
                                                  )}
                                                  {activity.location && (
                                                    <span className="flex items-center gap-1">
                                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                      </svg>
                                                      {activity.location}
                                                    </span>
                                                  )}
                                                  {activity.cost > 0 && (
                                                    <span>{formatCurrency(activity.cost)}</span>
                                                  )}
                                                </div>
                                              </div>
                                              
                                              {/* More Options */}
                                              <button className="text-gray-400 hover:text-gray-600 p-1">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                                </svg>
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center h-24 text-gray-400">
                                <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                <p className="text-sm">No activities planned</p>
                                <button className={`text-xs ${colors.text} hover:underline mt-1`}>
                                  Add your first activity
                                </button>
                              </div>
                            )}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>

                      {/* Day Notes - only show when not collapsed */}
                      {!isCollapsed && day.notes && (
                        <div className="border-t border-gray-100 p-4">
                          <p className="text-sm text-gray-600">{day.notes}</p>
                        </div>
                      )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </DragDropContext>
      )}

      {/* Timeline View (Read-Only Summary) */}
      {viewMode === 'timeline' && (() => {
        const daysWithActivities = trip.days.filter(day => day.activities.length > 0);
        
        return (
          <div className="bg-white rounded-xl p-8 shadow-sm border">
            {daysWithActivities.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📜</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Activities Yet</h3>
                <p className="text-gray-600 mb-6">Switch to Day View to start planning your trip</p>
                <button
                  onClick={() => setViewMode('day')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Go to Day View
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {daysWithActivities.map((day, dayIndex) => {
                  const dayIndexInTrip = trip.days.findIndex(d => d.id === day.id);
                  const destination = trip.destinations.find(dest => 
                    new Date(dest.startDate) <= new Date(day.date) &&
                    new Date(dest.endDate) >= new Date(day.date)
                  );
                  const colors = destination ? getDestinationColors(destination.id, trip.destinations, true) : { bg: 'bg-gray-100', text: 'text-gray-600' };

                  return (
                    <div key={day.id} className="relative">
                      {/* Timeline Connector */}
                      {dayIndex < daysWithActivities.length - 1 && (
                        <div className="absolute left-[19px] top-12 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 to-transparent" />
                      )}
                      
                      {/* Day Header */}
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`flex-shrink-0 w-10 h-10 ${colors.bg} ${colors.text} rounded-full flex items-center justify-center font-semibold shadow-md`}>
                          {dayIndexInTrip + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-baseline gap-3">
                            <h3 className="text-xl font-semibold text-gray-900">{formatDate(day.date)}</h3>
                            {destination && (
                              <span className={`text-sm ${colors.text} font-medium`}>
                                {destination.name}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                            <span>{day.activities.length} {day.activities.length === 1 ? 'activity' : 'activities'}</span>
                            {day.totalCost > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-green-600 font-medium">{formatCurrency(day.totalCost)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Activities */}
                      <div className="ml-14 space-y-3">
                        {day.activities
                          .sort((a, b) => a.order - b.order)
                          .map((activity) => (
                            <div
                              key={activity.id}
                              className="flex gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100"
                            >
                              {/* Activity Icon */}
                              <div className="flex-shrink-0">
                                <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-base shadow-sm border border-gray-200">
                                  {ACTIVITY_TYPES[activity.type].icon}
                                </div>
                              </div>

                              {/* Activity Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h4 className="font-medium text-gray-900">{activity.title}</h4>
                                    
                                    {/* Time and Location */}
                                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                                      {activity.time && (
                                        <span className="flex items-center gap-1">
                                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                          {activity.time}
                                        </span>
                                      )}
                                      {activity.location && (
                                        <span className="flex items-center gap-1">
                                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                          </svg>
                                          {activity.location}
                                        </span>
                                      )}
                                      <span className="text-gray-400">•</span>
                                      <span className="text-gray-500">{ACTIVITY_TYPES[activity.type].label}</span>
                                    </div>

                                    {/* Description */}
                                    {activity.description && (
                                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{activity.description}</p>
                                    )}
                                  </div>

                                  {/* Cost */}
                                  {activity.cost > 0 && (
                                    <span className="text-sm font-medium text-green-600 ml-4">
                                      {formatCurrency(activity.cost)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>

                      {/* Day Notes */}
                      {day.notes && (
                        <div className="ml-14 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <span className="text-sm">📝</span>
                            <p className="text-sm text-gray-700 flex-1">{day.notes}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
