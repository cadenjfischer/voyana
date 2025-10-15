'use client';

import { useRef, useCallback } from 'react';
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
                  
                  return (
                    <div
                      key={day.id}
                      ref={(el) => {
                        if (el) destinationRefs.current[day.id] = el;
                      }}
                      className={`bg-white rounded-xl border-2 transition-all duration-300 ${
                        isActiveDay 
                          ? 'border-blue-500 shadow-xl ring-4 ring-blue-100' 
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                      }`}
                    >
                      {/* Day Header */}
                      <div
                        onClick={() => onDaySelect?.(day.id)}
                        className={`w-full text-left transition-all duration-200 ${
                          onDaySelect 
                            ? 'hover:brightness-95 cursor-pointer' 
                            : 'cursor-default'
                        }`}
                      >
                        <div 
                          className="border-b border-gray-100 p-4 rounded-t-xl"
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
                              className={`px-3 py-1.5 text-sm font-medium ${colors.text} hover:bg-white rounded-lg transition-colors duration-200`}
                            >
                              + Add
                            </button>
                          </div>
                        </div>
                      </div>
                      </div>

                      {/* Activities */}
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

                      {/* Day Notes */}
                      {day.notes && (
                        <div className="border-t border-gray-100 p-4">
                          <p className="text-sm text-gray-600">{day.notes}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </DragDropContext>
    </div>
  );
}