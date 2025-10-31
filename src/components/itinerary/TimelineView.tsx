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
    <div className="flex-1 min-h-0 flex flex-col bg-static-bg-50 dark:bg-static-bg-900">
      {/* Header with View Toggle and Expand/Collapse */}
  <div className="flex-shrink-0 flex justify-between items-center px-6 py-4 border-b border-static-gray-700 bg-static-bg-50 dark:bg-static-bg-900">
        {/* Minimal Segmented Control */}
        <div className="inline-flex items-center rounded-md p-0.5 border border-static-gray-700 bg-static-bg-100 dark:bg-static-bg-800">
          <button
            onClick={() => setViewMode('day')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
              viewMode === 'day'
                ? 'tab-strip-gradient text-static-text-50 shadow-sm'
                : 'text-static-text-700 hover:text-static-text-900 dark:text-static-text-300 dark:hover:text-static-text-50 hover:bg-static-bg-100 dark:hover:bg-static-bg-700'
            }`}
          >
            Planning
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
              viewMode === 'timeline'
                ? 'tab-strip-gradient text-static-text-50 shadow-sm'
                : 'text-static-text-700 hover:text-static-text-900 dark:text-static-text-300 dark:hover:text-static-text-50 hover:bg-static-bg-100 dark:hover:bg-static-bg-700'
            }`}
          >
            Timeline
          </button>
        </div>

        {/* Expand/Collapse All Button (only show in Day View) */}
        {viewMode === 'day' && (
          <button
            onClick={toggleAll}
            className="text-sm font-medium text-static-text-700 dark:text-static-text-300 hover:text-static-text-900 dark:hover:text-static-text-50 px-3 py-1.5 rounded-lg hover:bg-static-bg-100 dark:hover:bg-static-bg-800 transition-colors duration-200 flex items-center gap-1.5"
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

      {/* Scrollable Content Container */}
      <div className="flex-1 overflow-y-auto pb-20">
        {/* Day View (Planning Mode) */}
        {viewMode === 'day' && (
          <DragDropContext onDragEnd={handleActivityDragEnd}>
          {Object.entries(groupedDays).map(([destinationId, { destination, days }]) => {
            const colors = getDestinationColors(destinationId, trip.destinations, true);
          
          return (
            <div key={destinationId}>
              {/* Days Table */}
              <div className="bg-static-bg-50 dark:bg-static-bg-900 border-t border-b border-static-gray-700">
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
                        'ocean-blue': `oklch(90.14% 0.0555 230.9 / ${opacity})`,
                        'tropical-green': `oklch(92.50% 0.0806 155.99 / ${opacity})`, 
                        'sunset-purple': `oklch(90.24% 0.0604 306.7 / ${opacity})`,
                        'adventure-orange': `oklch(90.15% 0.0729 70.7 / ${opacity})`,
                        'cherry-pink': `oklch(82.28% 0.1095 346.02 / ${opacity})`,
                        'deep-indigo': `oklch(86.99% 0.0622 274.04 / ${opacity})`,
                        'ruby-red': `oklch(88.45% 0.0593 18.33 / ${opacity})`,
                        'emerald-teal': `oklch(91.00% 0.0927 180.43 / ${opacity})`,
                        'golden-yellow': `oklch(90.52% 0.1657 98.11 / ${opacity})`,
                        'wine-burgundy': `oklch(80.77% 0.1035 19.57 / ${opacity})`,
                        'bronze-gold': `oklch(86.06% 0.1731 91.94 / ${opacity})`,
                        'navy-midnight': `oklch(86.90% 0.0198 252.89 / ${opacity})`,
                        'mint-fresh': `oklch(90.49% 0.0895 164.15 / ${opacity})`,
                        'sunset-coral': `oklch(83.66% 0.1165 66.29 / ${opacity})`,
                        'arctic-cyan': `oklch(91.67% 0.0772 205.04 / ${opacity})`,
                        'magenta-fuchsia': `oklch(74.77% 0.207 322.16 / ${opacity})`
                      };
                      return colorMap[dest.customColor] || 'var(--color-neutral-50)';
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
                      `oklch(90.14% 0.0555 230.9 / ${opacity})`, 
                      `oklch(92.50% 0.0806 155.99 / ${opacity})`, 
                      `oklch(90.24% 0.0604 306.7 / ${opacity})`, 
                      `oklch(90.15% 0.0729 70.7 / ${opacity})`, 
                      `oklch(82.28% 0.1095 346.02 / ${opacity})`, 
                      `oklch(86.99% 0.0622 274.04 / ${opacity})`, 
                      `oklch(88.45% 0.0593 18.33 / ${opacity})`, 
                      `oklch(91.00% 0.0927 180.43 / ${opacity})`, 
                      `oklch(90.52% 0.1657 98.11 / ${opacity})`, 
                      `oklch(80.77% 0.1035 19.57 / ${opacity})`, 
                      `oklch(86.06% 0.1731 91.94 / ${opacity})`, 
                      `oklch(86.90% 0.0198 252.89 / ${opacity})`, 
                      `oklch(90.49% 0.0895 164.15 / ${opacity})`, 
                      `oklch(83.66% 0.1165 66.29 / ${opacity})`, 
                      `oklch(91.67% 0.0772 205.04 / ${opacity})`, 
                      `oklch(74.77% 0.207 322.16 / ${opacity})`
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
                        return { backgroundColor: 'var(--color-neutral-50)' }; // light gray for unassigned
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
                        return { backgroundColor: 'oklch(90.15% 0.0729 70.7)' }; // orange-200
                      }
                    } else {
                      // Regular days
                      if (destination) {
                        return { backgroundColor: getCalendarBgHex(destination.id, isHovered) };
                      } else {
                        return { backgroundColor: 'var(--color-neutral-50)' }; // light gray for unassigned days
                      }
                    }
                  };
                  
                  return (
                    <div
                      key={day.id}
                      ref={(el) => {
                        if (el) destinationRefs.current[day.id] = el;
                      }}
                      className="border-b border-static-gray-700 last:border-b-0 transition-all bg-static-bg-50 dark:bg-static-bg-900"
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
                                <h3 className="font-semibold text-static-text-900 dark:text-static-text-50">
                                  Day {dayIndexInTrip + 1} • {formatDate(day.date)}
                                </h3>
                                <p className="text-sm text-static-text-900 dark:text-static-text-50 mt-1">
                                  {day.activities.length} activities • {formatCurrency(day.totalCost)}
                                  {!destination && (
                                    <span className="ml-2 text-orange-600 dark:text-orange-400">• Unassigned</span>
                                  )}
                                </p>
                              </div>
                            </div>

                          {/* Center: Destination */}
                          <div className="text-center">
                            {isTransfer ? (
                              <div className="flex items-center justify-center gap-2">
                                <span className="text-sm text-orange-600 dark:text-orange-400 font-medium">Transfer Day</span>
                                <div className="flex items-center gap-1">
                                  {(() => {
                                    const prevDayIndex = dayIndexInTrip - 1;
                                    const prevDay = prevDayIndex >= 0 ? trip.days[prevDayIndex] : null;
                                    const prevDestination = prevDay?.destinationId 
                                      ? trip.destinations.find(d => d.id === prevDay.destinationId)
                                      : null;
                                    
                                    return (
                                      <>
                                        <span className="text-xs text-static-text-900 dark:text-static-text-50">
                                          {prevDestination?.name || 'Unknown'}
                                        </span>
                                        <svg className="w-3 h-3 text-orange-500 dark:text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-xs text-static-text-900 dark:text-static-text-50">
                                          {destination?.name || 'Unknown'}
                                        </span>
                                      </>
                                    );
                                  })()}
                                </div>
                              </div>
                            ) : destination ? (
                              <p className="text-base font-medium text-static-text-900 dark:text-static-text-50">
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
                                className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-static-text-900 dark:text-static-text-50 hover:bg-static-bg-100 dark:hover:bg-static-bg-800 rounded-lg transition-colors duration-200`}
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
                                  <div className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 w-80">
                                    <div className="grid grid-cols-2">
                                      {Object.entries(ACTIVITY_TYPES)
                                        .filter(([type]) => !['flight', 'lodging', 'map', 'directions'].includes(type))
                                        .map(([type, config], index, array) => {
                                          const isLastRow = index >= array.length - 2;
                                          const isRightColumn = index % 2 === 1;
                                          // Borders: remove middle divider for bottom-left, ensure bottom line under bottom-right
                                          const addRightDivider = !isRightColumn && !isLastRow;
                                          const addBottomDivider = !isLastRow || (isLastRow && isRightColumn);
                                          return (
                                            <button
                                              key={type}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleAddActivityType(day.id, type as Activity['type']);
                                              }}
                                              className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left ${
                                                addBottomDivider ? 'border-b' : ''
                                              } ${addRightDivider ? 'border-r' : ''} border-gray-200 dark:border-gray-700`}
                                            >
                                              <div className="w-8 h-8 rounded-full bg-static-accent-600 flex items-center justify-center flex-shrink-0">
                                                <ActivityIcon iconName={config.icon} className="text-static-text-50" size={16} />
                                              </div>
                                              <span className="text-sm text-static-text-900 dark:text-static-text-50 font-normal">{config.label}</span>
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
                              className="p-1.5 hover:bg-static-bg-100 dark:hover:bg-static-bg-800 rounded transition-colors duration-200"
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
                                ? 'bg-static-bg-100 dark:bg-static-bg-800 border-2 border-dashed border-static-accent-300 dark:border-static-accent-700 rounded-lg' 
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
                                        className={`bg-white dark:bg-static-bg-800 border border-static-gray-300 dark:border-static-gray-700 rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all duration-200 ${
                                          snapshot.isDragging 
                                            ? 'rotate-2 scale-105 shadow-2xl border-static-accent-300 dark:border-static-accent-700 bg-static-bg-100 dark:bg-static-bg-700 z-50' 
                                            : 'hover:shadow-md hover:border-static-gray-400 dark:hover:border-static-gray-600'
                                        }`}
                                      >
                                        <div className="flex items-start gap-3">
                                          {/* Activity Icon */}
                                          <div className="w-8 h-8 bg-static-accent-600 rounded-full flex items-center justify-center flex-shrink-0">
                                            <ActivityIcon 
                                              iconName={getActivityIcon(activity)} 
                                              className="text-static-text-50" 
                                              size={16}
                                            />
                                          </div>
                                          
                                          {/* Activity Content */}
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between">
                                              <div className="flex-1">
                                                <h4 className="font-medium text-static-text-900 dark:text-static-text-50 text-sm">
                                                  {activity.title}
                                                </h4>
                                                {activity.description && (
                                                  <p className="text-xs text-static-text-900 dark:text-static-text-50 mt-1">
                                                    {activity.description}
                                                  </p>
                                                )}
                                                <div className="flex items-center gap-3 mt-2 text-xs text-static-text-900 dark:text-static-text-50">
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
                                              <button className="text-static-text-600 hover:text-static-text-900 dark:text-static-text-400 dark:hover:text-static-text-50 p-1">
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
                              <div className="flex flex-col items-center justify-center h-24 text-static-text-600 dark:text-static-text-400">
                                <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                <p className="text-sm">No activities planned</p>
                                <button 
                                  onClick={() => toggleDropdown(day.id)}
                                  className={`text-xs text-static-text-700 dark:text-static-text-300 hover:underline mt-1`}
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
          <div className="bg-static-bg-50 dark:bg-static-bg-900 rounded-xl p-8 shadow-sm border border-static-gray-700">
            {daysWithActivities.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-static-bg-100 dark:bg-static-bg-800">
                  <span className="text-3xl">📜</span>
                </div>
                <h3 className="text-lg font-medium text-static-text-900 dark:text-static-text-50 mb-2">No Activities Yet</h3>
                <p className="text-static-text-700 dark:text-static-text-300 mb-6">Switch to Day View to start planning your trip</p>
                <button
                  onClick={() => setViewMode('day')}
                  className="bg-static-accent-600 hover:bg-static-accent-700 text-static-text-50 px-6 py-2 rounded-lg font-medium transition-colors"
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
                        <div className="absolute left-[19px] top-12 bottom-0 w-0.5 bg-gradient-to-b from-static-accent-300 dark:from-static-accent-700 to-transparent" />
                      )}
                      
                      {/* Day Header */}
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-semibold shadow-md bg-static-accent-700 text-static-text-50">
                          {dayIndexInTrip + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-baseline gap-3">
                            <h3 className="text-xl font-semibold text-static-text-900 dark:text-static-text-50">{formatDate(day.date)}</h3>
                            {destination && (
                              <span className="text-sm text-static-text-700 dark:text-static-text-300 font-medium">
                                {destination.name}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-static-text-700 dark:text-static-text-300 mt-1">
                            <span>{day.activities.length} {day.activities.length === 1 ? 'activity' : 'activities'}</span>
                            {day.totalCost > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-static-accent-600 font-medium">{formatCurrency(day.totalCost)}</span>
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
                              className="flex gap-3 p-4 bg-white dark:bg-static-bg-800 rounded-lg border border-static-gray-300 dark:border-static-gray-700"
                            >
                              {/* Activity Icon */}
                              <div className="flex-shrink-0">
                                <div className="w-9 h-9 rounded-full flex items-center justify-center text-base shadow-sm bg-static-accent-600 text-static-text-50">
                                  <ActivityIcon iconName={ACTIVITY_TYPES[activity.type].icon} className="text-static-text-50" size={16} />
                                </div>
                              </div>

                              {/* Activity Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h4 className="font-medium text-static-text-900 dark:text-static-text-50">{activity.title}</h4>
                                    
                                    {/* Time and Location */}
                                    <div className="flex items-center gap-3 mt-1 text-sm text-static-text-700 dark:text-static-text-300">
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
                                      <span className="text-static-text-600 dark:text-static-text-400">•</span>
                                      <span className="text-static-text-700 dark:text-static-text-300">{ACTIVITY_TYPES[activity.type].label}</span>
                                    </div>

                                    {/* Description */}
                                    {activity.description && (
                                      <p className="text-sm text-static-text-700 dark:text-static-text-300 mt-2 line-clamp-2">{activity.description}</p>
                                    )}
                                  </div>

                                  {/* Cost */}
                                  {activity.cost > 0 && (
                                    <span className="text-sm font-medium text-static-accent-600 ml-4">
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
                        <div className="ml-14 mt-3 p-3 bg-static-bg-100 dark:bg-static-bg-800 border border-static-gray-300 dark:border-static-gray-700 rounded-lg">
                          <div className="flex items-start gap-2">
                            <span className="text-sm">📝</span>
                            <p className="text-sm text-static-text-700 dark:text-static-text-300 flex-1">{day.notes}</p>
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
    </div>
  );
}
