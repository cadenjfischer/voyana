'use client';

import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { Day, Trip, formatDate } from '@/types/itinerary';
import { getCalendarColors, getProgressIndicatorClass, getCalendarColorsWithTransfer } from '@/utils/colors';

interface CalendarStripProps {
  days: Day[];
  activeDay: string;
  onDaySelect: (dayId: string) => void;
  trip: Trip;
  transparent?: boolean;
  centered?: boolean;
}



export default function CalendarStrip({ days, activeDay, onDaySelect, trip, transparent = false, centered = false }: CalendarStripProps) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const stripRef = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [dayScale, setDayScale] = useState(1);
  const [isScrollable, setIsScrollable] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const MIN_SCALE = 0.75; // don't scale below this - reduced for smaller size
  const BASE_DAY_WIDTH = 88; // reduced from 112 for smaller cards
  const GAP = 6; // reduced gap between items
  
  // Auto-scroll to active day
  useEffect(() => {
    if (!stripRef.current || !activeDay) return;
    
    const activeIndex = days.findIndex(day => day.id === activeDay);
    if (activeIndex === -1) return;
    
    const dayWidth = 94; // Approximate width of each day button - reduced
    const containerWidth = stripRef.current.clientWidth;
    const targetScroll = (activeIndex * dayWidth) - (containerWidth / 2) + (dayWidth / 2);
    
    stripRef.current.scrollTo({
      left: Math.max(0, targetScroll),
      behavior: 'smooth'
    });
  }, [activeDay, days]);

  // Responsive scaling to fit days into available space up to a minimum scale
  useLayoutEffect(() => {
    function recompute() {
      const outer = outerRef.current;
      const inner = innerRef.current;
      if (!outer || !inner) return;

      const availableWidth = outer.clientWidth - 16; // leave some padding
      const totalBaseWidth = days.length * BASE_DAY_WIDTH + Math.max(0, days.length - 1) * GAP;

      if (totalBaseWidth <= availableWidth) {
        setDayScale(1);
        setIsScrollable(false);
        // disable overflow when fits
        if (stripRef.current) {
          stripRef.current.classList.remove('overflow-x-auto');
          stripRef.current.style.justifyContent = 'center';
        }
      } else {
        const candidate = availableWidth / totalBaseWidth;
        if (candidate >= MIN_SCALE) {
          setDayScale(candidate);
          setIsScrollable(false);
          if (stripRef.current) {
            stripRef.current.classList.remove('overflow-x-auto');
            stripRef.current.style.justifyContent = 'center';
          }
        } else {
          setDayScale(MIN_SCALE);
          setIsScrollable(true);
          // enable scrolling when too many days
          if (stripRef.current) {
            stripRef.current.classList.add('overflow-x-auto');
            stripRef.current.style.justifyContent = 'flex-start';
          }
        }
      }
    }

    recompute();

    const ro = new ResizeObserver(() => recompute());
    if (outerRef.current) ro.observe(outerRef.current);
    window.addEventListener('orientationchange', recompute);
    return () => {
      ro.disconnect();
      window.removeEventListener('orientationchange', recompute);
    };
  }, [days]);

  // Handle scroll position for fade effects and constrain over-scroll
  const handleScroll = useCallback(() => {
    if (!stripRef.current || !innerRef.current) return;
    
    const container = stripRef.current;
    const content = innerRef.current;
    
    // Get actual dimensions
    const containerWidth = container.clientWidth;
    const contentWidth = content.scrollWidth * dayScale; // Account for scaling
    const paddingLeft = isScrollable ? 8 : 24; // px-2 or px-6
    const paddingRight = paddingLeft;
    
    // Calculate max scroll position (content width - visible area + padding)
    const maxScroll = Math.max(0, contentWidth - containerWidth + paddingLeft + paddingRight);
    
    // Constrain scroll position
    if (container.scrollLeft > maxScroll) {
      container.scrollLeft = maxScroll;
    }
    if (container.scrollLeft < 0) {
      container.scrollLeft = 0;
    }
    
    const currentScroll = container.scrollLeft;
    setScrollPosition(currentScroll);
    
    // Update arrow visibility based on scroll position
    setCanScrollLeft(currentScroll > 5);
    setCanScrollRight(currentScroll < maxScroll - 5);
  }, [dayScale, isScrollable]);

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
      
      {/* Left Arrow Button - shows when scrollable and can scroll left */}
      {isScrollable && canScrollLeft && (
        <button
          onClick={() => {
            if (stripRef.current) {
              stripRef.current.scrollBy({ left: -100, behavior: 'smooth' });
            }
          }}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 transition-all duration-200 hover:scale-110"
          aria-label="Scroll left"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      
      {/* Right Arrow Button - shows when scrollable and can scroll right */}
      {isScrollable && canScrollRight && (
        <button
          onClick={() => {
            if (stripRef.current) {
              stripRef.current.scrollBy({ left: 100, behavior: 'smooth' });
            }
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 transition-all duration-200 hover:scale-110"
          aria-label="Scroll right"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Calendar strip */}
      <div ref={outerRef} className="w-full flex justify-start">
        <div
          ref={stripRef}
          className={`flex gap-1.5 scrollbar-thin py-2 ${isScrollable ? 'px-1 overflow-x-auto' : 'px-3 mx-auto'}`}
          onScroll={handleScroll}
          style={{
            scrollbarWidth: 'thin',
            msOverflowStyle: 'none',
            overscrollBehavior: 'contain'
          }}
        >
          <div ref={innerRef} className="flex gap-1.5 items-stretch" style={{ 
            transform: `scale(${dayScale})`, 
            transformOrigin: 'left center'
          }}>
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
              className={`flex-shrink-0 w-20 p-2 rounded-lg border-2 text-center transition-all duration-300 relative overflow-hidden transform hover:scale-105 active:scale-95 ${
                isActive ? 'border-gray-800 shadow-lg scale-105' : 'border-gray-300 hover:shadow-md hover:border-gray-400'
              } ${dynamicColors.isTransfer ? 'ring-2 ring-orange-400' : ''}`}
              style={{
                background: dynamicColors.bg,
                color: dynamicColors.text
              }}
            >
              {/* Transfer day indicator */}
              {dynamicColors.isTransfer && (
                <div className="absolute top-0.5 right-0.5">
                  <div className="w-2.5 h-2.5 bg-orange-500 rounded-full border border-white flex items-center justify-center">
                    <svg className="w-1.5 h-1.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
              {/* Day number */}
              <div className="text-[10px] font-medium opacity-75 mb-0.5">
                Day {info.dayNumber}
              </div>
              

              
              {/* Weekday */}
              <div className="text-xs font-medium">
                {info.weekday}
              </div>
              
              {/* Date */}
              <div className="text-base font-bold">
                {info.date}
              </div>
              
              {/* Month */}
              <div className="text-[10px] opacity-75">
                {info.month}
              </div>
              
              {/* Today indicator */}
              {info.isToday && (
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full mx-auto mt-0.5" />
              )}
              
              {/* Activity indicator */}
              {hasActivities && !isActive && (
                <div className="flex justify-center gap-0.5 mt-0.5">
                                    {Array.from({ length: 3 }, (_, i) => (
                    <div key={i} className="w-0.5 h-0.5 rounded-full bg-gray-400" />
                  ))}
                </div>
              )}
            </button>
          );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}