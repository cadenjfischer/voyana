'use client';

import { useState, useRef, useEffect } from 'react';
import { Day, Trip, formatDate } from '@/types/itinerary';
import { getCalendarColors, getProgressIndicatorClass, getCalendarColorsWithTransfer } from '@/utils/colors';

interface CalendarStripProps {
  days: Day[];
  activeDay: string;
  onDaySelect: (dayId: string) => void;
  trip: Trip;
  transparent?: boolean;
}



export default function CalendarStrip({ days, activeDay, onDaySelect, trip, transparent = false }: CalendarStripProps) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const stripRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to active day
  useEffect(() => {
    if (!stripRef.current || !activeDay) return;
    
    const activeIndex = days.findIndex(day => day.id === activeDay);
    if (activeIndex === -1) return;
    
    const dayWidth = 120; // Approximate width of each day button
    const containerWidth = stripRef.current.clientWidth;
    const targetScroll = (activeIndex * dayWidth) - (containerWidth / 2) + (dayWidth / 2);
    
    stripRef.current.scrollTo({
      left: Math.max(0, targetScroll),
      behavior: 'smooth'
    });
  }, [activeDay, days]);

  // Handle scroll position for fade effects
  const handleScroll = () => {
    if (stripRef.current) {
      setScrollPosition(stripRef.current.scrollLeft);
    }
  };

  // Get destination for a day
  const getDayDestination = (day: Day) => {
    return trip.destinations.find(dest => dest.id === day.destinationId);
  };

  // Get day display info
  const getDayInfo = (day: Day, index: number) => {
    const date = new Date(day.date);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    return {
      dayNumber: index + 1,
      weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      isToday,
      isWeekend: date.getDay() === 0 || date.getDay() === 6
    };
  };

  return (
    <div className={`relative ${transparent ? '' : 'bg-white border-b border-gray-200'}`}>
      {/* Left fade */}
      {!transparent && (
        <div 
          className={`absolute left-0 top-0 w-8 h-full bg-gradient-to-r from-white to-transparent z-10 pointer-events-none transition-opacity duration-200 ${
            scrollPosition > 10 ? 'opacity-100' : 'opacity-0'
          }`} 
        />
      )}
      
      {/* Right fade */}
      {!transparent && (
        <div 
          className={`absolute right-0 top-0 w-8 h-full bg-gradient-to-l from-white to-transparent z-10 pointer-events-none transition-opacity duration-200`}
        />
      )}

      {/* Calendar strip */}
      <div
        ref={stripRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide px-6 py-4"
        onScroll={handleScroll}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {days.map((day, index) => {
          const info = getDayInfo(day, index);
          const isActive = day.id === activeDay;
          const hasActivities = day.activities.length > 0;
          
          // Get destination color with transfer day support
          const getDayColors = () => {
            if (!day.destinationId) {
              return { bg: '#f9fafb', text: '#6b7280', isTransfer: false };
            }
            
            // Check if this day is beyond the allocated nights for this destination
            const destination = trip.destinations.find(d => d.id === day.destinationId);
            if (!destination || destination.nights === 0) {
              return { bg: '#f9fafb', text: '#6b7280', isTransfer: false };
            }
            
            // Count how many days are assigned to this destination up to this point
            const daysAssignedToThisDestination = days.slice(0, index + 1).filter(d => d.destinationId === day.destinationId).length;
            
            // If this day exceeds the allocated nights + 1 (for departure day), treat as unassigned
            // You get (nights + 1) days in a destination because you wake up there on the departure day
            if (destination.nights === 0 || daysAssignedToThisDestination > destination.nights + 1) {
              return { bg: '#f9fafb', text: '#6b7280', isTransfer: false };
            }
            
            return getCalendarColorsWithTransfer(day.destinationId, index, days, trip.destinations);
          };
          
          const dynamicColors = getDayColors();
          
          return (
            <button
              key={day.id}
              onClick={() => onDaySelect(day.id)}
              className={`flex-shrink-0 w-28 p-3 rounded-xl border-2 text-center transition-all duration-300 relative overflow-hidden transform hover:scale-105 active:scale-95 ${
                isActive ? 'border-gray-800 shadow-xl scale-105' : 'border-gray-300 hover:shadow-md hover:border-gray-400'
              } ${dynamicColors.isTransfer ? 'ring-2 ring-orange-400' : ''}`}
              style={{
                background: dynamicColors.bg,
                color: dynamicColors.text
              }}
            >
              {/* Transfer day indicator */}
              {dynamicColors.isTransfer && (
                <div className="absolute top-1 right-1">
                  <div className="w-3 h-3 bg-orange-500 rounded-full border border-white flex items-center justify-center">
                    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
              {/* Day number */}
              <div className="text-xs font-medium opacity-75 mb-1">
                Day {info.dayNumber}
              </div>
              

              
              {/* Weekday */}
              <div className="text-sm font-medium">
                {info.weekday}
              </div>
              
              {/* Date */}
              <div className="text-lg font-bold">
                {info.date}
              </div>
              
              {/* Month */}
              <div className="text-xs opacity-75">
                {info.month}
              </div>
              
              {/* Today indicator */}
              {info.isToday && (
                <div className="w-2 h-2 bg-red-500 rounded-full mx-auto mt-1" />
              )}
              
              {/* Activity indicator */}
              {hasActivities && !isActive && (
                <div className="flex justify-center gap-0.5 mt-1">
                                    {Array.from({ length: 3 }, (_, i) => (
                    <div key={i} className="w-1 h-1 rounded-full bg-gray-400" />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Current position indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-100">
        <div 
          className={`h-full transition-all duration-300 ${
            (() => {
              const activeIndex = days.findIndex(day => day.id === activeDay);
              if (activeIndex >= 0) {
                const activeDay = days[activeIndex];
                const activeDayData = days[activeIndex];
                if (activeDayData && activeDayData.destinationId) {
                  return getProgressIndicatorClass(activeDayData.destinationId, trip.destinations);
                }
              }
              return 'bg-gray-500';
            })()
          }`}
          style={{
            width: days.length > 0 ? `${(days.findIndex(day => day.id === activeDay) + 1) / days.length * 100}%` : '0%'
          }}
        />
      </div>
    </div>
  );
}