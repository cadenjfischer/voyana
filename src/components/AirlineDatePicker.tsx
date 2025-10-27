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
}

export default function AirlineDatePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  className = '',
  compact = false
}: AirlineDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectingStart, setSelectingStart] = useState(true);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLButtonElement>(null);
  const [inputPosition, setInputPosition] = useState({ top: 0, left: 0, width: 0 });

  const today = new Date();
  today.setHours(12, 0, 0, 0); // Set to noon for consistent comparison
  
  const selectedStartDate = startDate ? new Date(startDate + 'T12:00:00') : null;
  const selectedEndDate = endDate ? new Date(endDate + 'T12:00:00') : null;

  // Update input position when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setInputPosition({
        top: rect.top,
        left: rect.left,
        width: rect.width
      });
    }
  }, [isOpen]);

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
    if (!startDate) return 'Select departure date';
    
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    };
    
    if (end) {
      return `${formatDate(start)} - ${formatDate(end)}`;
    }
    return formatDate(start);
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
    if (!selectedStartDate || !selectedEndDate) return false;
    return date >= selectedStartDate && date <= selectedEndDate;
  };

  // Check if date is in hover range
  const isDateInHoverRange = (date: Date) => {
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
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {getMonthYear(month)}
          </h3>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-3">
          {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day) => (
            <div key={day} className="h-8 flex items-center justify-center">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {day}
              </span>
            </div>
          ))}
        </div>

        {/* Calendar grid - Only actual month dates */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((date, index) => {
            const isToday = isSameDay(date, today);
            const isStartDate = selectedStartDate && isSameDay(date, selectedStartDate);
            const isEndDate = selectedEndDate && isSameDay(date, selectedEndDate);
            const isInRange = isDateInRange(date);
            const isInHoverRange = isDateInHoverRange(date);
            const isPastDate = date < today;
            
            // Simple grid cell - all dates are current month now
            let buttonClass = 'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors';
            
            if (isPastDate) {
              buttonClass += ' text-gray-300 cursor-not-allowed';
            } else if (isStartDate || isEndDate) {
              buttonClass += ' bg-blue-500 text-white font-semibold';
            } else if (isInRange || isInHoverRange) {
              buttonClass += ' bg-blue-100 text-blue-700';
            } else if (isToday) {
              buttonClass += ' text-blue-700 font-semibold bg-white';
            } else {
              buttonClass += ' text-gray-700 hover:bg-blue-50 cursor-pointer';
            }

            return (
              <button
                key={index}
                type="button"
                className={buttonClass}
                onClick={() => !isPastDate && handleDateClick(date)}
                onMouseEnter={() => !isPastDate && setHoveredDate(date)}
                onMouseLeave={() => setHoveredDate(null)}
                disabled={isPastDate}
              >
                {date.getDate()}
              </button>
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
          className={compact 
            ? "w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
            : "w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-xl bg-white hover:border-gray-400 transition-colors duration-200"
          }
        >
          {compact ? (
            <>
              <div className="text-xs text-gray-500 mb-1">Dates</div>
              <div className="font-semibold text-gray-900 truncate">
                {startDate && endDate
                  ? `${format(new Date(startDate), 'MMM d')} - ${format(new Date(endDate), 'MMM d')}`
                  : startDate
                  ? format(new Date(startDate), 'MMM d, yyyy')
                  : 'Add dates'}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <span className={`text-sm ${startDate ? 'text-gray-900' : 'text-gray-500'}`}>
                {formatDateRange()}
              </span>
            </div>
          )}
          {!compact && (
            <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
          )}
        </button>
      </div>

      {/* Calendar dropdown - rendered in portal */}
      {isOpen && typeof window !== 'undefined' && createPortal(
        <div 
          ref={pickerRef}
          className="fixed bg-white rounded-xl shadow-xl border border-gray-200 z-[9999] p-6"
          style={compact ? {
            top: inputPosition.top + 60,
            left: inputPosition.left,
            width: Math.max(inputPosition.width, 600)
          } : {
            top: inputPosition.top - 20,
            left: inputPosition.left,
            width: Math.max(inputPosition.width, 600),
            transform: 'translateY(-100%)'
          }}
        >
          {/* Navigation header */}
          <div className="flex items-center justify-between mb-6">
            <button
              type="button"
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            
            <div className="text-center">
              <span className="text-sm text-gray-500">Select departure date</span>
            </div>
            
            <button
              type="button"
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Two month view */}
          <div className="flex gap-8">
            {renderMonth(currentMonth)}
            {renderMonth(getNextMonth(currentMonth))}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}