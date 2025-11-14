'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface AirlineDatePickerProps {
  startDate?: string;
  endDate?: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  className?: string;
  compact?: boolean; // New prop for condensed search bar style
  single?: boolean; // If true, select a single date (one-way) and disable range hover
  mobile?: boolean; // If true, use mobile style with label inside
}

export default function AirlineDatePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  className = '',
  compact = false,
  single = false,
  mobile = false
}: AirlineDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectingStart, setSelectingStart] = useState(true);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLButtonElement>(null);
  const [inputPosition, setInputPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [positionAbove, setPositionAbove] = useState(false);

  const today = new Date();
  today.setHours(12, 0, 0, 0); // Set to noon for consistent comparison
  
  const selectedStartDate = startDate ? new Date(startDate + 'T12:00:00') : null;
  const selectedEndDate = endDate ? new Date(endDate + 'T12:00:00') : null;

  // Update input position when opening
  useEffect(() => {
    if (!isOpen || !inputRef.current) return;
    
    const update = () => {
      if (!inputRef.current) return;
      const rect = inputRef.current.getBoundingClientRect();
      const calendarHeight = single ? 320 : 450; // More accurate calendar height
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      // Position above if not enough space below
      const shouldPositionAbove = spaceBelow < calendarHeight && spaceAbove > spaceBelow;
      setPositionAbove(shouldPositionAbove);
      
      setInputPosition({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height
      });
    };
    
    update();
    // Use requestAnimationFrame for smoother position updates
    let rafId: number;
    const smoothUpdate = () => {
      update();
      rafId = requestAnimationFrame(smoothUpdate);
    };
    rafId = requestAnimationFrame(smoothUpdate);
    
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isOpen, single]);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format date for display
  const formatDateRange = () => {
    if (!startDate) return single ? 'Select date' : 'Select dates';
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return end ? `${fmt(start)} - ${fmt(end)}` : fmt(start);
  };

  // Get month name and year
  const getMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  // Get next month
  const getNextMonth = (date: Date) => {
    const next = new Date(date);
    next.setMonth(next.getMonth() + 1);
    return next;
  };

  // Navigate months
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentMonth(newMonth);
  };

  // Check if two dates are the same day
  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  // Check if date is in selected range
  const isDateInRange = (date: Date) => {
    if (single) return false;
    if (!selectedStartDate || !selectedEndDate) return false;
    return date >= selectedStartDate && date <= selectedEndDate;
  };

  // Check if date is in hover range
  const isDateInHoverRange = (date: Date) => {
    if (single) return false;
    if (!selectedStartDate || !hoveredDate || selectedEndDate) return false;
    const start = selectedStartDate;
    const end = hoveredDate;
    const minDate = start < end ? start : end;
    const maxDate = start < end ? end : start;
    return date >= minDate && date <= maxDate;
  };

  // Handle date click
  const handleDateClick = (date: Date) => {
    const isPastDate = date < today;
    if (isPastDate) return;

    // Use local timezone to avoid date shifts
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    if (single) {
      onStartDateChange(dateString);
      onEndDateChange('');
      setIsOpen(false);
      return;
    }

    if (selectingStart || !selectedStartDate) {
      onStartDateChange(dateString);
      onEndDateChange('');
      setSelectingStart(false);
    } else {
      if (date < selectedStartDate) {
        onStartDateChange(dateString);
        onEndDateChange('');
      } else {
        onEndDateChange(dateString);
        setIsOpen(false);
        setSelectingStart(true);
      }
    }
  };

  // Generate calendar days for a month
  const generateCalendarDays = (month: Date) => {
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    
    const days = [];
    
    // Only generate days that are actually in this month
    // Create dates at noon to avoid timezone issues
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(month.getFullYear(), month.getMonth(), day, 12, 0, 0);
      days.push(date);
    }

    return days;
  };

  // Render a single month
  const renderMonth = (month: Date) => {
    const days = generateCalendarDays(month);
    const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    return (
      <div className="flex-1 min-w-0">
        {/* Month header */}
        <div className={`text-center ${single ? 'mb-3' : 'mb-4'}`}>
          <h3 className={`${single ? 'text-base' : 'text-lg'} font-semibold text-static-text-900 dark:text-static-text-50`}>
            {getMonthYear(month)}
          </h3>
        </div>

        {/* Day headers */}
        <div className={`grid grid-cols-7 ${single ? 'mb-2' : 'mb-3'}`}>
          {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day) => (
            <div key={day} className={`${single ? 'h-7' : 'h-8'} flex items-center justify-center`}>
              <span className="text-xs font-medium text-static-text-900 dark:text-static-text-50 opacity-60 uppercase tracking-wide">
                {day}
              </span>
            </div>
          ))}
        </div>

        {/* Calendar grid - Only actual month dates */}
        <div className="grid grid-cols-7">
          {days.map((date, index) => {
            const isToday = isSameDay(date, today);
            const isStartDate = selectedStartDate && isSameDay(date, selectedStartDate);
            const isEndDate = selectedEndDate && isSameDay(date, selectedEndDate);
            const isInRange = isDateInRange(date);
            const isInHoverRange = isDateInHoverRange(date);
            const isPastDate = date < today;
            
            // Check if adjacent dates are in range
            const prevInRange = index > 0 && (isDateInRange(days[index - 1]) || isDateInHoverRange(days[index - 1]) || (selectedStartDate && isSameDay(days[index - 1], selectedStartDate)));
            const nextInRange = index < days.length - 1 && (isDateInRange(days[index + 1]) || isDateInHoverRange(days[index + 1]) || (selectedEndDate && isSameDay(days[index + 1], selectedEndDate)));
            
            // Determine if this is the end of a hover range
            const isHoverEnd = isInHoverRange && hoveredDate && isSameDay(date, hoveredDate) && selectedStartDate && !selectedEndDate;
            
            const showRangeBackground = (isInRange || isInHoverRange) && !isPastDate && !isStartDate && !isEndDate && !isHoverEnd;
            
            // Wrapper div for range background - full width cell
            let wrapperClass = `relative ${single ? 'h-7' : 'h-8'} flex items-center justify-center`;
            if (showRangeBackground) {
              wrapperClass += ' bg-static-accent-200 dark:bg-static-accent-800/60';
              
              // Add rounded corners at the start/end of ranges
              if (!prevInRange) {
                wrapperClass += ' rounded-l-full';
              }
              if (!nextInRange) {
                wrapperClass += ' rounded-r-full';
              }
            }
            
            // For start/end dates, add half backgrounds
            if ((isStartDate || isEndDate || isHoverEnd) && !isPastDate) {
              if (isStartDate && nextInRange) {
                wrapperClass += ' after:absolute after:right-0 after:top-0 after:bottom-0 after:left-1/2 after:bg-static-accent-200 dark:after:bg-static-accent-800/60';
              }
              if ((isEndDate && prevInRange) || (isHoverEnd && prevInRange)) {
                wrapperClass += ' before:absolute before:left-0 before:top-0 before:bottom-0 before:right-1/2 before:bg-static-accent-200 dark:before:bg-static-accent-800/60';
              }
            }
            
            // Button class for the date number
            const cellSize = single ? 'w-7 h-7' : 'w-8 h-8';
            const fontSize = single ? 'text-xs' : 'text-sm';
            let buttonClass = `relative ${cellSize} rounded-full flex items-center justify-center ${fontSize} font-medium transition-colors z-10`;
            
            if (isPastDate) {
              buttonClass += ' text-static-text-900 dark:text-static-text-50 opacity-20 cursor-not-allowed';
            } else if (isStartDate || isEndDate) {
              buttonClass += ' bg-static-accent-500 dark:bg-static-accent-400 text-white font-semibold';
            } else if (isHoverEnd) {
              buttonClass += ' bg-static-accent-400 dark:bg-static-accent-500 text-white font-semibold';
            } else if (isInRange || isInHoverRange) {
              buttonClass += ' text-static-accent-700 dark:text-static-accent-200';
            } else if (isToday) {
              buttonClass += ' text-static-accent-700 dark:text-static-accent-400 font-semibold bg-transparent dark:bg-transparent';
            } else {
              buttonClass += ' text-static-text-900 dark:text-static-text-50 hover:bg-static-accent-400 dark:hover:bg-static-accent-600 hover:text-white dark:hover:text-white cursor-pointer';
            }

            return (
              <div key={index} className={wrapperClass}>
                <button
                  type="button"
                  className={buttonClass}
                  onClick={() => !isPastDate && handleDateClick(date)}
                  onMouseEnter={() => !isPastDate && setHoveredDate(date)}
                  onMouseLeave={() => setHoveredDate(null)}
                  disabled={isPastDate}
                >
                  {date.getDate()}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className={`relative ${className}`}>
        {/* Input field */}
        <button
          ref={inputRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={
            mobile
              ? "w-full h-14 px-4 flex items-center border border-static-gray-400 dark:border-static-bg-600 rounded-lg bg-white dark:bg-static-bg-800 hover:border-static-accent-500 dark:hover:border-static-accent-400 focus:ring-2 focus:ring-static-accent-500 focus:border-static-accent-500 transition-colors"
              : compact 
              ? "w-full h-14 px-4 flex flex-col justify-center text-left hover:bg-gray-50 dark:hover:bg-gray-800 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-colors"
              : "w-full h-12 flex items-center justify-between px-4 border border-static-gray-400 dark:border-static-bg-600 rounded-xl bg-transparent hover:border-static-accent-500 dark:hover:border-static-accent-400 focus:ring-2 focus:ring-static-accent-500 focus:border-static-accent-500 transition-colors duration-200"
          }
        >
          {mobile ? (
            <>
              <Calendar className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-3 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-static-text-900 dark:text-static-text-50 font-medium mb-0.5">{single ? 'Date' : 'Dates'}</div>
                <div className="text-sm truncate text-static-text-900 dark:text-static-text-50">
                  {formatDateRange()}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
            </>
          ) : compact ? (
            <>
              <div className="text-xs text-static-text-900 dark:text-static-text-50 mb-1">{single ? 'Date' : 'Dates'}</div>
              <div className="font-semibold text-static-text-900 dark:text-static-text-50 truncate">
                {startDate && endDate
                  ? `${format(new Date(startDate), 'MMM d')} - ${format(new Date(endDate), 'MMM d')}`
                  : startDate
                  ? format(new Date(startDate), 'MMM d, yyyy')
                  : 'Add dates'}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Calendar className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
              <span className="text-sm truncate text-static-text-900 dark:text-static-text-50 font-medium">
                {formatDateRange()}
              </span>
            </div>
          )}
          {!compact && !mobile && (
            <ChevronRight className={`w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
          )}
        </button>
      </div>

      {/* Calendar dropdown - rendered in portal */}
      {isOpen && typeof window !== 'undefined' && createPortal(
        <div 
          ref={pickerRef}
          className={`absolute bg-static-bg-50 dark:bg-static-bg-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-[10002] ${single ? 'p-4' : 'p-6'}`}
          style={{
            bottom: positionAbove 
              ? window.innerHeight - inputPosition.top + 6
              : 'auto',
            top: positionAbove
              ? 'auto'
              : inputPosition.top + (compact ? 60 : inputPosition.height + 6),
            right: typeof window !== 'undefined' ? window.innerWidth - inputPosition.left - inputPosition.width : 'auto',
            width: single ? '320px' : '600px',
          }}
        >
          {/* Navigation header */}
          <div className={`flex items-center justify-between ${single ? 'mb-4' : 'mb-6'}`}>
            <button
              type="button"
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
            >
              <ChevronLeft className="w-5 h-5 text-static-text-900 dark:text-static-text-50" />
            </button>
            
            <div className="text-center">
              <span className="text-sm text-static-text-900 dark:text-static-text-50 opacity-60">{single ? 'Select date' : 'Select departure date'}</span>
            </div>
            
            <button
              type="button"
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
            >
              <ChevronRight className="w-5 h-5 text-static-text-900 dark:text-static-text-50" />
            </button>
          </div>

          {/* Two month view */}
          <div className={`flex ${single ? 'gap-0' : 'gap-8'}`}>
            {renderMonth(currentMonth)}
            {!single && renderMonth(getNextMonth(currentMonth))}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}