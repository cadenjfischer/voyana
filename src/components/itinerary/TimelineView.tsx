'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Trip, Destination, Day, Activity, ACTIVITY_TYPES, formatDate, formatCurrency } from '@/types/itinerary';
import { getDestinationColors, isTransferDay } from '@/utils/colors';
import { ActivityIcon } from '@/components/ActivityIcon';
import * as LucideIcons from 'lucide-react';

interface TimelineViewProps {
  trip: Trip;
  activeDestinationId: string;
  activeDay: string;
  destinationRefs: React.MutableRefObject<{ [key: string]: HTMLDivElement }>;
  onDaysUpdate: (days: Day[]) => void;
  onDaySelect?: (dayId: string) => void;
  onOpenActivityModal?: (dayId: string, activityType: Activity['type']) => void;
}

export default function TimelineView({
  trip,
  activeDestinationId,
  activeDay,
  destinationRefs,
  onDaysUpdate,
  onDaySelect,
  onOpenActivityModal
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

  // Track hover state for days
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  // Dropdown state for adding activities
  const [openDropdownDayId, setOpenDropdownDayId] = useState<string | null>(null);

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

  // Toggle dropdown
  const toggleDropdown = (dayId: string) => {
    setOpenDropdownDayId(openDropdownDayId === dayId ? null : dayId);
  };

  // Handle adding a new activity from dropdown
  const handleAddActivityType = (dayId: string, type: Activity['type']) => {
    setOpenDropdownDayId(null);
    if (onOpenActivityModal) {
      onOpenActivityModal(dayId, type);
    }
  };

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

  // Get activity icon name
  const getActivityIcon = (activity: Activity) => {
    const config = ACTIVITY_TYPES[activity.type];
    return config?.icon || 'StickyNote';
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
    <div className="h-full flex flex-col">
      {/* Header with View Toggle and Expand/Collapse */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-white">
        {/* Minimal Segmented Control */}
        <div className="inline-flex items-center bg-gray-100 rounded-md p-0.5">
          <button
            onClick={() => setViewMode('day')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
              viewMode === 'day'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Planning
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
              viewMode === 'timeline'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
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
            <div key={destinationId}>
              {/* Days Table */}
              <div className="bg-white border-t border-b border-gray-200">
                {days.map((day, dayIndex) => {
                  const isActiveDay = day.id === activeDay;
                  const dayIndexInTrip = trip.days.findIndex(d => d.id === day.id);
                  const isTransfer = isTransferDay(dayIndexInTrip, trip.days, trip.destinations);
                  const isCollapsed = collapsedDays.has(day.id);
                  
                  // Helper function to get calendar background color with reduced opacity
                  const getCalendarBgHex = (destId: string, hoverOpacity = false) => {
                    const opacity = hoverOpacity ? 0.7 : 0.3;
                    const dest = trip.destinations.find(d => d.id === destId);
                    if (dest?.customColor) {
                      const colorMap: { [key: string]: string } = {
                        'ocean-blue': `rgba(186, 230, 253, ${opacity})`,
                        'tropical-green': `rgba(187, 247, 208, ${opacity})`, 
                        'sunset-purple': `rgba(233, 213, 255, ${opacity})`,
                        'adventure-orange': `rgba(254, 215, 170, ${opacity})`,
                        'cherry-pink': `rgba(249, 168, 212, ${opacity})`,
                        'deep-indigo': `rgba(199, 210, 254, ${opacity})`,
                        'ruby-red': `rgba(254, 202, 202, ${opacity})`,
                        'emerald-teal': `rgba(153, 246, 228, ${opacity})`,
                        'golden-yellow': `rgba(253, 224, 71, ${opacity})`,
                        'wine-burgundy': `rgba(252, 165, 165, ${opacity})`,
                        'bronze-gold': `rgba(250, 204, 21, ${opacity})`,
                        'navy-midnight': `rgba(203, 213, 225, ${opacity})`,
                        'mint-fresh': `rgba(167, 243, 208, ${opacity})`,
                        'sunset-coral': `rgba(253, 186, 116, ${opacity})`,
                        'arctic-cyan': `rgba(165, 243, 252, ${opacity})`,
                        'magenta-fuchsia': `rgba(232, 121, 249, ${opacity})`
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
                    const calendarBgs = [
                      `rgba(186, 230, 253, ${opacity})`, 
                      `rgba(187, 247, 208, ${opacity})`, 
                      `rgba(233, 213, 255, ${opacity})`, 
                      `rgba(254, 215, 170, ${opacity})`, 
                      `rgba(249, 168, 212, ${opacity})`, 
                      `rgba(199, 210, 254, ${opacity})`, 
                      `rgba(254, 202, 202, ${opacity})`, 
                      `rgba(153, 246, 228, ${opacity})`, 
                      `rgba(253, 224, 71, ${opacity})`, 
                      `rgba(252, 165, 165, ${opacity})`, 
                      `rgba(250, 204, 21, ${opacity})`, 
                      `rgba(203, 213, 225, ${opacity})`, 
                      `rgba(167, 243, 208, ${opacity})`, 
                      `rgba(253, 186, 116, ${opacity})`, 
                      `rgba(165, 243, 252, ${opacity})`, 
                      `rgba(232, 121, 249, ${opacity})`
                    ];
                    const hash = generateHash(destId);
                    return calendarBgs[hash % calendarBgs.length];
                  };

                  // Calculate the background style
                  const getBackgroundStyle = () => {
                    const isHovered = hoveredDay === day.id;
                    
                    // Check if this day should be treated as unassigned due to nights allocation
                    if (destination && day.destinationId) {
                      const daysAssignedToThisDestination = trip.days.slice(0, dayIndexInTrip + 1).filter(d => d.destinationId === day.destinationId).length;
                      if (destination.nights === 0 || daysAssignedToThisDestination > destination.nights + 1) {
                        return { backgroundColor: '#f9fafb' }; // light gray for unassigned
                      }
                    }
                    
                    if (isTransfer) {
                      const prevDayIndex = dayIndexInTrip - 1;
                      const prevDay = prevDayIndex >= 0 ? trip.days[prevDayIndex] : null;
                      const prevDestination = prevDay?.destinationId 
                        ? trip.destinations.find(d => d.id === prevDay.destinationId)
                        : null;
                      
                      if (prevDestination && destination) {
                        const prevBg = getCalendarBgHex(prevDestination.id, isHovered);
                        const currentBg = getCalendarBgHex(destination.id, isHovered);
                        return { background: `linear-gradient(to right, ${prevBg}, ${currentBg})` };
                      } else {
                        return { backgroundColor: '#fed7aa' }; // orange-200
                      }
                    } else {
                      // Regular days
                      if (destination) {
                        return { backgroundColor: getCalendarBgHex(destination.id, isHovered) };
                      } else {
                        return { backgroundColor: '#f9fafb' }; // light gray for unassigned days
                      }
                    }
                  };
                  
                  return (
                    <div
                      key={day.id}
                      ref={(el) => {
                        if (el) destinationRefs.current[day.id] = el;
                      }}
                      style={getBackgroundStyle()}
                      className="border-b border-gray-300 last:border-b-0 transition-all hover:shadow-sm"
                      onMouseEnter={() => setHoveredDay(day.id)}
                      onMouseLeave={() => setHoveredDay(null)}
                    >
                      {/* Day Header */}
                      <div
                        className="w-full text-left cursor-pointer"
                        onClick={() => {
                          if (onDaySelect) onDaySelect(day.id);
                        }}
                      >
                        <div className="p-4">
                          <div className="grid grid-cols-3 items-center">
                            {/* Left: Day Info */}
                            <div className="flex items-center gap-3">
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
                            {/* Add Activity Dropdown Button */}
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleDropdown(day.id);
                                }}
                                className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium ${colors.text} hover:bg-white rounded-lg transition-colors duration-200`}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Add a Plan
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>

                              {/* Dropdown Menu */}
                              {openDropdownDayId === day.id && (
                                <>
                                  {/* Backdrop to close dropdown when clicking outside */}
                                  <div 
                                    className="fixed inset-0 z-40" 
                                    onClick={() => setOpenDropdownDayId(null)}
                                  />
                                  
                                  {/* Dropdown */}
                                  <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-80">
                                    <div className="grid grid-cols-2">
                                      {Object.entries(ACTIVITY_TYPES)
                                        .filter(([type]) => !['flight', 'lodging', 'map', 'directions'].includes(type))
                                        .map(([type, config], index, array) => {
                                          const isLastRow = index >= array.length - 2;
                                          const isRightColumn = index % 2 === 1;
                                          return (
                                            <button
                                              key={type}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleAddActivityType(day.id, type as Activity['type']);
                                              }}
                                              className={`flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left ${
                                                !isLastRow ? 'border-b' : ''
                                              } ${!isRightColumn ? 'border-r' : ''} border-gray-100`}
                                            >
                                              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                                                <ActivityIcon iconName={config.icon} className="text-white" size={16} />
                                              </div>
                                              <span className="text-sm text-gray-700 font-normal">{config.label}</span>
                                            </button>
                                          );
                                        })}
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                            
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
                                          <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                                            <ActivityIcon 
                                              iconName={getActivityIcon(activity)} 
                                              className="text-blue-600" 
                                              size={16}
                                            />
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
                                <button 
                                  onClick={() => toggleDropdown(day.id)}
                                  className={`text-xs ${colors.text} hover:underline mt-1`}
                                >
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
